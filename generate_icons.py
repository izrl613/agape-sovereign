from PIL import Image

img = Image.open('public/agape-logo-120.png')
img.resize((192, 192), Image.LANCZOS).save('public/agape-logo-192.png')
img.resize((512, 512), Image.LANCZOS).save('public/agape-logo-512.png')
print('Icons generated: 192x192 and 512x512')
