import torch
import torch.nn as nn
import torch.nn.functional as F

class DoubleConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )
    def forward(self, x):
        return self.conv(x)

class EdgeAttentionModule(nn.Module):
    """
    Attention module that focuses on structural edges and geometry.
    Crucial for camouflaged object detection.
    """
    def __init__(self, in_channels):
        super().__init__()
        self.edge_conv = nn.Conv2d(in_channels, 1, kernel_size=1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        edge_map = self.edge_conv(x)
        attention_weights = self.sigmoid(edge_map)
        # Enhance original features with edge attention
        return x * (1 + attention_weights), edge_map

class EdgeGuidedUNet(nn.Module):
    def __init__(self, in_channels=3, out_channels=1):
        super().__init__()
        self.inc = DoubleConv(in_channels, 64)
        self.down1 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(64, 128))
        self.down2 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(128, 256))
        self.down3 = nn.Sequential(nn.MaxPool2d(2), DoubleConv(256, 512))
        
        # Edge/Structure extraction at the bottleneck
        self.edge_attention = EdgeAttentionModule(512)
        
        self.up1 = nn.ConvTranspose2d(512, 256, kernel_size=2, stride=2)
        self.dec1 = DoubleConv(512, 256)
        
        self.up2 = nn.ConvTranspose2d(256, 128, kernel_size=2, stride=2)
        self.dec2 = DoubleConv(256, 128)
        
        self.up3 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.dec3 = DoubleConv(128, 64)
        
        self.outc = nn.Conv2d(64, out_channels, kernel_size=1)
        self.edge_out = nn.Conv2d(1, out_channels, kernel_size=1)

    def forward(self, x):
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        
        # Apply Edge Attention for geometry preservation
        x4_attended, edge_map = self.edge_attention(x4)
        
        u1 = self.up1(x4_attended)
        # Pad if necessary
        diffY = x3.size()[2] - u1.size()[2]
        diffX = x3.size()[3] - u1.size()[3]
        u1 = F.pad(u1, [diffX // 2, diffX - diffX // 2, diffY // 2, diffY - diffY // 2])
        u1 = torch.cat([x3, u1], dim=1)
        d1 = self.dec1(u1)
        
        u2 = self.up2(d1)
        u2 = torch.cat([x2, u2], dim=1)
        d2 = self.dec2(u2)
        
        u3 = self.up3(d2)
        u3 = torch.cat([x1, u3], dim=1)
        d3 = self.dec3(u3)
        
        segmentation_mask = self.outc(d3)
        edge_map_full = F.interpolate(edge_map, size=segmentation_mask.shape[2:], mode='bilinear', align_corners=False)
        return segmentation_mask, edge_map_full
