document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const uploadForm = document.getElementById('upload-form');
    const imageInput = document.getElementById('image-input');
    const uploadArea = document.getElementById('upload-area');
    const imageInfoWrapper = document.getElementById('image-info-wrapper');
    const imagePreview = document.getElementById('image-preview');
    
    // Details fields
    const originalFilename = document.getElementById('original-filename');
    const originalFilesize = document.getElementById('original-filesize');
    const originalDimsPx = document.getElementById('original-dims-px');
    const originalDimsIn = document.getElementById('original-dims-in');
    const originalDimsCm = document.getElementById('original-dims-cm');

    // Options fields
    const targetSizeInput = document.getElementById('target-size');
    const qualitySliderGroup = document.getElementById('quality-slider-group');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('quality-value');

    const submitBtn = document.getElementById('submit-btn');
    const statusArea = document.getElementById('status-area');
    const resultArea = document.getElementById('result-area');
    const downloadContainer = document.getElementById('download-container');

    const DPI = 96;

    // --- Drag and Drop Logic ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-over'), false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            imageInput.files = files;
            handleFile(files[0]);
        }
    }

    // --- Event Listeners ---
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (file) handleFile(file);
    });
    
    targetSizeInput.addEventListener('input', () => {
        const hasValue = targetSizeInput.value && targetSizeInput.value > 0;
        qualitySliderGroup.classList.toggle('disabled', hasValue);
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        showStatus('Processing, please wait...', 'loading');
        submitBtn.disabled = true;
        resultArea.classList.add('hidden');

        const formData = new FormData(uploadForm);

        try {
            const response = await fetch('/process', { method: 'POST', body: formData });
            if (response.ok) {
                // This line might throw an error if the response is not a valid blob
                const blob = await response.blob();
                handleSuccess(blob);
            } else {
                const errorData = await response.json();
                handleError(errorData.error || 'An unknown server error occurred.');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            handleError('A network error occurred. Please check your connection.');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // --- Core File Handling Function ---
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            handleError('Invalid file type. Please select an image.');
            return;
        }

        statusArea.textContent = '';
        statusArea.className = '';
        resultArea.classList.add('hidden');

        originalFilename.textContent = file.name;
        originalFilesize.textContent = formatFileSize(file.size);

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            const img = new Image();
            img.onload = () => {
                const w = img.naturalWidth;
                const h = img.naturalHeight;
                originalDimsPx.textContent = `${w} x ${h} px`;
                originalDimsIn.textContent = `${(w / DPI).toFixed(2)} x ${(h / DPI).toFixed(2)} in`;
                originalDimsCm.textContent = `${((w / DPI) * 2.54).toFixed(2)} x ${((h / DPI) * 2.54).toFixed(2)} cm`;
                imageInfoWrapper.classList.remove('hidden');
                submitBtn.disabled = false;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // --- UI Helper Functions ---
    function showStatus(message, type = 'loading') {
        statusArea.textContent = message;
        statusArea.className = type === 'error' ? 'status-error' : 'status-loading';
    }

    function handleSuccess(blob) {
        statusArea.textContent = '';
        statusArea.className = '';

        const url = URL.createObjectURL(blob);
        
        const originalFullName = imageInput.files[0].name;
        const lastDot = originalFullName.lastIndexOf('.');
        const originalName = lastDot > -1 ? originalFullName.slice(0, lastDot) : originalFullName;
        
        const newExtension = blob.type.split('/')[1].replace('jpeg', 'jpg');
        const processedFilename = `processed_${originalName}.${newExtension}`;
        
        downloadContainer.innerHTML = `
            <a href="${url}" download="${processedFilename}">Download Image</a>
            <p>New file size: <strong>${formatFileSize(blob.size)}</strong></p>
        `;
        resultArea.classList.remove('hidden');
    }

    function handleError(errorMessage) {
        showStatus(errorMessage, 'error');
        resultArea.classList.add('hidden');
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});