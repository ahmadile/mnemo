"""Generate icons for the Mnemo Chrome extension."""
from PIL import Image, ImageDraw, ImageFont

def make_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Emerald gradient effect via solid + slightly darker corners
    draw.rounded_rectangle([0, 0, size-1, size-1], radius=size//5, fill=(16, 185, 129, 255))
    # Add 'M' letter
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", size=int(size * 0.6))
    except:
        font = ImageFont.load_default()
    text = 'M'
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2
    y = (size - text_h) // 2 - bbox[1]
    draw.text((x, y), text, fill=(10, 10, 10, 255), font=font)
    return img

for s in [16, 48, 128]:
    img = make_icon(s)
    img.save(f'/home/z/my-project/download/mnemo-datacamp-extension/icons/icon{s}.png')
    print(f'Created icon{s}.png')
