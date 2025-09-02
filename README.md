# Pro Image Tool: Web-Based Compressor & Resizer

A powerful, user-friendly, and open-source web application for resizing and compressing images directly in your browser. Built with Flask and modern JavaScript, this tool is designed for speed and efficiency, catering to bloggers, developers, students, and anyone needing to quickly optimize images for the web.

---

## Table of Contents

-   [✨ Features](#-features)
-   [🛠️ Tech Stack](#️-tech-stack)
-   [🚀 Getting Started](#-getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Installation & Setup](#installation--setup)
-   [📁 Project Structure](#-project-structure)
-   [⚙️ How It Works (Technical Deep Dive)](#️-how-it-works-technical-deep-dive)
    -   [Backend Logic (Flask & Pillow)](#backend-logic-flask--pillow)
    -   [Frontend Logic (JavaScript)](#frontend-logic-javascript)
-   [🛣️ Future Roadmap](#️-future-roadmap)
-   [🤝 Contributing](#-contributing)
-   [📄 License](#-license)

---

## ✨ Features

This tool goes beyond basic resizing and offers a suite of powerful features:

-   **Dynamic Image Resizing**: Resize images by specifying width and/or height. The aspect ratio is automatically maintained if only one dimension is provided.
-   **Multiple Measurement Units**: Define new dimensions in Pixels (px), Inches (in), or Centimeters (cm), with automatic conversion based on a standard 96 DPI.
-   **Advanced Compression Control**:
    -   **Quality Slider (1-100%)**: Simple and intuitive control over the image's quality and file size.
    -   **Target File Size (KB/MB)**: A powerful feature that automatically adjusts compression to get the image file size as close as possible to a specified target (e.g., "under 500 KB").
-   **Intelligent Format Conversion**: Automatically converts PNG files to JPEG when lossy compression is requested, ensuring significant file size reduction where lossless formats would fail.
-   **Modern Drag & Drop Interface**: Upload files quickly by dragging them directly onto the upload area.
-   **Instant Image Preview & Details**: Before processing, the tool displays a preview of the selected image along with its original filename, file size, and dimensions in all supported units.
-   **Client-Side Processing Feedback**: The UI provides real-time feedback, showing loading states, success messages, and clear error notifications without reloading the page.
-   **Direct Browser Download**: Processed images are delivered directly to the user's browser, ready for immediate download.
-   **Fully Responsive Design**: A clean, modern UI that works seamlessly on desktops, tablets, and mobile devices.

---

## 🛠️ Tech Stack

The application is built with a simple but powerful set of technologies, emphasizing reliability and performance.

-   **Backend**:
    -   **Python 3**: The core programming language.
    -   **Flask**: A lightweight WSGI web application framework for handling routing and requests.
    -   **Pillow (PIL Fork)**: The de-facto image processing library for Python, used for all resizing and compression operations.

-   **Frontend**:
    -   **HTML5**: Semantic markup for the application structure.
    -   **CSS3**: Modern styling with Flexbox/Grid for a responsive and professional layout.
    -   **Vanilla JavaScript (ES6+)**: For all client-side interactivity, including:
        -   **Fetch API**: For asynchronous communication with the Flask backend.
        -   **FormData**: To easily handle file uploads.
        -   **DOM Manipulation**: To create a dynamic and responsive user experience.

---

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running for development or testing purposes.

### Prerequisites

Make sure you have the following installed on your system:
-   **Python 3.8+**
-   **pip** (Python package installer)
-   **git** (for cloning the repository)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/devranjeet/imgcompress.git
    cd imgcompress
    ```

2.  **Create and activate a virtual environment:**
    This is a best practice to keep project dependencies isolated.
    
    *On macOS/Linux:*
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
    
    *On Windows:*
    ```bash
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Flask application:**
    ```bash
    python app.py
    ```

5.  **Open the application in your browser:**
    Navigate to `http://127.0.0.1:5000`. You should now see the application running!

---

## 📁 Project Structure

The project follows a standard Flask application layout for clarity and maintainability.

```
pro-image-tool/
├── uploads/              # Temporary storage for original uploaded images
├── processed/            # Temporary storage for processed images before sending
├── static/
│   ├── style.css         # All CSS styles for the application
│   └── script.js         # All client-side JavaScript logic
├── templates/
│   └── index.html        # The main HTML file for the user interface
├── app.py                # The core Flask application logic
├── requirements.txt      # List of Python dependencies
└── README.md             # You are here!
```

---

## ⚙️ How It Works (Technical Deep Dive)

### Backend Logic (Flask & Pillow)

The backend is a single-file Flask application (`app.py`) that handles two primary routes:

1.  **`@app.route('/')`**: This route simply renders the `index.html` template, serving the main user interface.

2.  **`@app.route('/process', methods=['POST'])`**: This is the core API endpoint. Its workflow is as follows:
    -   **Validation**: It first checks if a file was provided and if it has an allowed extension (`.jpg`, `.png`, etc.).
    -   **File Storage**: The uploaded image is saved to a temporary `uploads/` directory with a unique UUID-based filename to prevent conflicts.
    -   **Image Loading**: The image is opened using the Pillow library.
    -   **Resizing**: If width or height parameters are provided, the image is resized using Pillow's high-quality `LANCZOS` resampling filter. Aspect ratio is preserved if only one dimension is given.
    -   **Compression Logic**:
        -   **Target Size Mode**: If a `target_size` is specified, the application enters an iterative compression loop. It repeatedly saves the image as a JPEG in-memory at decreasing quality levels (from 95 down to 10) until the resulting file size is just under the target. This provides a highly accurate result.
        -   **Quality Slider Mode**: If no target size is given, it uses the provided quality value.
        -   **Smart PNG Handling**: If the source is a PNG and the quality is less than 100, it converts the image to JPEG before saving. This is crucial because the "quality" setting is largely ineffective on lossless PNGs, and converting to JPEG is the user's implicit intent when they want a smaller file.
    -   **File Response**: The processed image is sent back to the client using Flask's `send_file` function with `as_attachment=True`. This triggers a download dialog in the user's browser.
    -   **Cleanup**: An `@after_this_request` decorator ensures that both the original and processed image files are deleted from the server after the response is sent, keeping the filesystem clean.

### Frontend Logic (JavaScript)

The `script.js` file manages all user interaction without requiring page reloads.

-   **Event Listeners**: Listeners are attached to the file input, drag-and-drop area, and form submission button.
-   **Drag & Drop**: The script handles `dragover`, `dragleave`, and `drop` events to provide visual feedback and capture dropped files, assigning them to the hidden file input for seamless integration.
-   **File Handling & Preview**: When a file is selected, a `FileReader` reads the image data. An `Image` object is then used to get its natural dimensions, which are calculated into px, in, and cm and displayed to the user.
-   **Asynchronous Submission**: On form submission, the default page reload is prevented. The `Fetch API` is used to send a `POST` request to the `/process` endpoint. The form's contents, including the image file, are packaged into a `FormData` object.
-   **Response Handling**:
    -   If the server returns a successful response (`response.ok`), the response body is read as a `Blob` (binary large object).
    -   `URL.createObjectURL()` is used to create a temporary, local URL for this blob.
    -   A new `<a>` tag is dynamically created with this URL as its `href` and a `download` attribute, allowing the user to download the processed image.
    -   If the server returns an error, the JSON error message is parsed and displayed to the user.

---

## 🛣️ Future Roadmap

This project has a solid foundation, but there are many potential features that could be added:

-   [ ] **Batch Processing**: Allow users to upload and process multiple images at once.
-   [ ] **More Output Formats**: Add support for modern formats like WebP and AVIF.
-   [ ] **Image Cropping**: Add a client-side cropping tool before processing.
-   [ ] **Watermarking**: Allow users to add a text or image watermark.
-   [ ] **Processing Presets**: Create presets for common use cases (e.g., "Web Article," "Email," "Social Media Profile").

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
