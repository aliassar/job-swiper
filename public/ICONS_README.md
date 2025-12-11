# PWA Icons

For the PWA to work properly, you need to create two icon files:

1. **icon-192.png** - 192x192px icon
2. **icon-512.png** - 512x512px icon

## Creating Icons

You can use any of these methods:

### Option 1: Use an online tool
- Visit https://www.pwabuilder.com/ and use their icon generator
- Or use https://realfavicongenerator.net/

### Option 2: Use ImageMagick (command line)
```bash
# Create a simple blue icon with "JS" text
convert -size 192x192 xc:#3b82f6 -gravity center -pointsize 64 -fill white -annotate +0+0 'JS' icon-192.png
convert -size 512x512 xc:#3b82f6 -gravity center -pointsize 180 -fill white -annotate +0+0 'JS' icon-512.png
```

### Option 3: Use a design tool
- Create icons in Figma, Adobe Illustrator, or Canva
- Export as PNG at 192x192 and 512x512 sizes
- Make sure the icons have a transparent or colored background
- Use your app's branding colors and logo

## Design Guidelines

- Use a simple, recognizable design
- Make sure the icon looks good at small sizes
- Consider using your brand colors (theme color: #3b82f6)
- The icon should be clear and legible
- Avoid too much detail or small text

## Temporary Solution

Until proper icons are created, you can use a service like:
- https://ui-avatars.com/api/?name=Job+Swiper&size=512&background=3b82f6&color=fff&bold=true&format=png

Save the output as icon-192.png and icon-512.png in this directory.
