import os
import uuid
import io
import traceback # Import traceback for better error logging
from flask import Flask, render_template, request, send_file, jsonify, after_this_request
from PIL import Image

# --- Configuration ---
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
DPI = 96

# --- Flask App Initialization ---
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PROCESSED_FOLDER'] = PROCESSED_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# --- Helper Functions ---
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_to_pixels(value, unit):
    if unit == 'in': return int(value * DPI)
    if unit == 'cm': return int((value / 2.54) * DPI)
    return int(value)

def compress_to_target_size(img, target_bytes):
    """
    Iteratively compress a JPEG image to be just under a target size.
    Returns a tuple of (image_bytes, final_extension).
    """
    buffer = io.BytesIO()
    for quality in range(95, 9, -5):
        buffer.seek(0)
        buffer.truncate()
        img.save(buffer, format='JPEG', quality=quality, optimize=True)
        if buffer.tell() <= target_bytes:
            return (buffer.getvalue(), 'jpg')
    return (buffer.getvalue(), 'jpg')

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_image():
    if 'image' not in request.files: return jsonify({'error': 'No image file provided.'}), 400
    file = request.files['image']
    if file.filename == '' or not allowed_file(file.filename): return jsonify({'error': 'Invalid file type.'}), 400

    original_filename = file.filename
    extension = original_filename.rsplit('.', 1)[1].lower()
    new_filename_base = uuid.uuid4().hex
    
    upload_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{new_filename_base}.{extension}")
    file.save(upload_path)
    
    processed_path = None
    
    try:
        with Image.open(upload_path) as img:
            original_width, original_height = img.size
            target_width = request.form.get('width', type=int)
            target_height = request.form.get('height', type=int)
            unit = request.form.get('unit', 'px')

            if target_width: target_width = convert_to_pixels(target_width, unit)
            if target_height: target_height = convert_to_pixels(target_height, unit)

            if target_width and not target_height:
                target_height = int(target_width * (original_height / original_width))
            elif target_height and not target_width:
                target_width = int(target_height * (original_width / original_height))
            
            if target_width and target_height:
                img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)

            if img.mode == 'RGBA':
                img = img.convert('RGB')

            target_size = request.form.get('target_size', type=float)
            
            if target_size and target_size > 0:
                unit = request.form.get('target_size_unit', 'kb')
                target_bytes = target_size * 1024 if unit == 'kb' else target_size * 1024 * 1024
                
                image_bytes, final_ext = compress_to_target_size(img, target_bytes)
                
                new_filename = f"{new_filename_base}.{final_ext}"
                processed_path = os.path.join(app.config['PROCESSED_FOLDER'], new_filename)
                
                with open(processed_path, 'wb') as f:
                    f.write(image_bytes)
                extension = final_ext
            
            else:
                quality = request.form.get('quality', 85, type=int)
                save_options = {}
                
                if extension == 'png' and quality < 100:
                    extension = 'jpg'
                
                if extension in ['jpg', 'jpeg']:
                    save_options['quality'] = quality
                    save_options['optimize'] = True
                elif extension == 'png':
                    save_options['optimize'] = True

                new_filename = f"{new_filename_base}.{extension}"
                processed_path = os.path.join(app.config['PROCESSED_FOLDER'], new_filename)
                img.save(processed_path, **save_options)
    
    except Exception as e:
        # **IMPROVEMENT**: Use traceback for detailed server-side error logs
        print("An error occurred during image processing:")
        traceback.print_exc()
        return jsonify({'error': 'An error occurred during image processing.'}), 500

    @after_this_request
    def cleanup(response):
        try:
            os.remove(upload_path)
            if processed_path and os.path.exists(processed_path):
                os.remove(processed_path)
        except Exception as error:
            app.logger.error("Error cleaning up files: %s", error)
        return response

    return send_file(
        processed_path,
        mimetype=f'image/{extension}',
        as_attachment=True,
        download_name=f'processed_{original_filename.rsplit(".", 1)[0]}.{extension}'
    )

if __name__ == '__main__':
    app.run(debug=True)