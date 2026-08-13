import os
import glob
from rembg import remove
from PIL import Image

def main():
    assets_dir = r"C:\Users\purpl\shadowsanctuary\public\assets\avatar-tests"
    swatches = glob.glob(os.path.join(assets_dir, "swatch_*.*"))
    anchors = glob.glob(os.path.join(assets_dir, "anchor_*.*"))
    
    all_images = swatches + anchors
    
    print(f"Found {len(all_images)} images to process.")
    
    out_dir = os.path.join(assets_dir, "transparent")
    os.makedirs(out_dir, exist_ok=True)
    
    for img_path in all_images:
        filename = os.path.basename(img_path)
        # Skip if it's already a transparent version or debug image
        if filename.endswith("_transparent.png") or "debug" in filename:
            continue
            
        name, _ = os.path.splitext(filename)
        out_path = os.path.join(out_dir, f"{name}_transparent.png")
        
        if os.path.exists(out_path):
            print(f"Skipping {filename}, already processed.")
            continue
            
        print(f"Processing {filename}...")
        try:
            input_image = Image.open(img_path)
            output_image = remove(input_image)
            output_image.save(out_path, "PNG")
        except Exception as e:
            print(f"Failed to process {filename}: {e}")
            
    print("Background removal complete.")

if __name__ == "__main__":
    main()
