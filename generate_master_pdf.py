import os
import fitz
import markdown

md_path = r"d:\img project\SENTINEL_PROJECT_SPECIFICATION.md"
html_path = r"d:\img project\SENTINEL_PROJECT_SPECIFICATION.html"
pdf_path = r"d:\img project\SENTINEL_PROJECT_SPECIFICATION.pdf"

with open(md_path, "r", encoding="utf-8") as f:
    text = f.read()

# Convert markdown to html with table and code extensions
html_body = markdown.markdown(text, extensions=['tables', 'fenced_code', 'nl2br'])

html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SENTINIX (SENTINEL) — Master Project Specification & Technical Blueprint</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 1.5cm 1.2cm 1.6cm 1.2cm;
  }}

  body {{
    font-family: Arial, Helvetica, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.5;
    font-size: 9pt;
    margin: 0;
    padding: 0;
  }}

  h1 {{
    font-size: 18pt;
    font-weight: bold;
    color: #0f172a;
    border-bottom: 3px solid #2563eb;
    padding-bottom: 6px;
    margin-top: 0;
    margin-bottom: 12px;
  }}

  h2 {{
    font-size: 12pt;
    font-weight: bold;
    color: #1e293b;
    border-bottom: 1.5px solid #cbd5e1;
    padding-bottom: 4px;
    margin-top: 18px;
    margin-bottom: 8px;
  }}

  h3 {{
    font-size: 10pt;
    font-weight: bold;
    color: #334155;
    margin-top: 12px;
    margin-bottom: 4px;
  }}

  h4 {{
    font-size: 9pt;
    font-weight: bold;
    color: #475569;
    margin-top: 8px;
    margin-bottom: 4px;
  }}

  p, li {{
    color: #334155;
    font-size: 8.5pt;
  }}

  p {{
    margin-top: 3px;
    margin-bottom: 6px;
  }}

  ul, ol {{
    margin-top: 3px;
    margin-bottom: 8px;
    padding-left: 18px;
  }}

  li {{
    margin-bottom: 3px;
  }}

  strong {{
    color: #0f172a;
    font-weight: bold;
  }}

  a {{
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    margin-bottom: 12px;
    font-size: 7.5pt;
  }}

  th {{
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: bold;
    text-align: left;
    padding: 5px 6px;
    border: 1px solid #94a3b8;
  }}

  td {{
    padding: 4px 6px;
    border: 1px solid #cbd5e1;
    vertical-align: top;
    color: #334155;
    word-break: break-word;
  }}

  tr:nth-child(even) {{
    background-color: #f8fafc;
  }}

  code {{
    font-family: Consolas, "Courier New", monospace;
    font-size: 7.5pt;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 1px 3px;
    border-radius: 2px;
    border: 1px solid #e2e8f0;
  }}

  pre {{
    background-color: #0f172a;
    color: #f8fafc;
    padding: 8px 10px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-family: Consolas, "Courier New", monospace;
    line-height: 1.35;
    margin-top: 6px;
    margin-bottom: 10px;
  }}

  pre code {{
    background-color: transparent;
    color: #f8fafc;
    padding: 0;
    border: none;
  }}

  hr {{
    border: none;
    border-top: 1px solid #cbd5e1;
    margin: 14px 0;
  }}

  blockquote {{
    margin: 8px 0;
    padding: 6px 12px;
    background-color: #eff6ff;
    border-left: 3px solid #3b82f6;
    color: #1e40af;
    font-size: 8pt;
  }}
</style>
</head>
<body>
  {html_body}
</body>
</html>
"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_template)

print("Rendered HTML:", html_path)

# Render to PDF via PyMuPDF native converter
doc = fitz.open(html_path)
pdf_bytes = doc.convert_to_pdf()
pdf_doc = fitz.open("pdf", pdf_bytes)
pdf_doc.save(pdf_path)

size_kb = os.path.getsize(pdf_path) / 1024
print(f"SUCCESS: Generated PDF at '{pdf_path}' ({size_kb:.1f} KB, {len(pdf_doc)} pages)")
