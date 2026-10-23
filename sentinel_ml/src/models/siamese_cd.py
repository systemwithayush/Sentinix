import torch
import torch.nn as nn
from .edge_guided_unet import DoubleConv

class SiameseChangeDetector(nn.Module):
    """
    Siamese network for change detection, comparing T1 and T2 satellite imagery.
    Utilizes shared weights to extract features and deeply compares them.
    """
    def __init__(self, in_channels=3, out_channels=1):
        super().__init__()
        
        # Shared Encoder (Siamese branch)
        self.encoder1 = DoubleConv(in_channels, 64)
        self.pool1 = nn.MaxPool2d(2)
        self.encoder2 = DoubleConv(64, 128)
        self.pool2 = nn.MaxPool2d(2)
        self.encoder3 = DoubleConv(128, 256)
        
        # Decoder (Fusion)
        self.up1 = nn.ConvTranspose2d(512, 128, kernel_size=2, stride=2)
        self.dec1 = DoubleConv(256, 128)
        
        self.up2 = nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2)
        self.dec2 = DoubleConv(128, 64)
        
        self.out_conv = nn.Conv2d(64, out_channels, kernel_size=1)
        
    def forward_once(self, x):
        e1 = self.encoder1(x)
        e2 = self.encoder2(self.pool1(e1))
        e3 = self.encoder3(self.pool2(e2))
        return e1, e2, e3
        
    def forward(self, t1, t2):
        # Extract features for both time periods
        t1_e1, t1_e2, t1_e3 = self.forward_once(t1)
        t2_e1, t2_e2, t2_e3 = self.forward_once(t2)
        
        # Concatenate features at the deepest level to find structural changes
        f3 = torch.cat([t1_e3, t2_e3], dim=1) # 256 + 256 = 512
        
        u1 = self.up1(f3)
        # Difference at intermediate level for finer structural changes
        diff2 = torch.abs(t1_e2 - t2_e2) 
        u1 = torch.cat([diff2, u1], dim=1) # 128 + 128 = 256
        d1 = self.dec1(u1)
        
        u2 = self.up2(d1)
        diff1 = torch.abs(t1_e1 - t2_e1)
        u2 = torch.cat([diff1, u2], dim=1) # 64 + 64 = 128
        d2 = self.dec2(u2)
        
        change_mask = self.out_conv(d2)
        return change_mask
