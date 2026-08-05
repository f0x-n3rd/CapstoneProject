
// ito ay para sa pag toggle ng form view at history panel
    function toggleFormView(showForm) {
        document.getElementById('history_panel').style.display = showForm ? 'none' : 'block';
        document.getElementById('form_panel').style.display = showForm ? 'block' : 'none';
        document.getElementById('app_navigation').style.display = showForm ? 'none' : 'flex';
    }
    function processForm(e) {
        e.preventDefault();
        alert('Payload Ready!');
        toggleFormView(false);
}

    // Store all selected images in one list.
    const selectedFiles = [];
    function showSelectedImage(input) {
        for (const file of input.files) {
         if (file.type.startsWith('image/') && !selectedFiles.includes(file)) {
                    selectedFiles.push(file);
        }
    }

    renderSelectedImages();
     input.value = '';
}

    function renderSelectedImages() {
        const fileNames = document.getElementById('selected_attachment');
        const previewArea = document.getElementById('attachment_preview');

    // Rebuild the preview area so every selected image remains visible.
        previewArea.innerHTML = '';
        fileNames.textContent = selectedFiles.length === 0 ? '' : `${selectedFiles.length} image${selectedFiles.length === 1 ? '' : 's'} selected`;
        previewArea.style.display = selectedFiles.length ? 'flex' : 'none';

    // ito yong pag Create ng preview for every selected image.
    for (const file of selectedFiles) {
        const previewWrapper = document.createElement('div');
        previewWrapper.className = 'image_preview_wrapper';

        const image = document.createElement('img');
        image.src = URL.createObjectURL(file);
        image.alt = file.name;
        image.title = file.name;
        image.className = 'image_preview';

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = 'x';
        removeButton.setAttribute('aria-label', `Remove ${file.name}`);
        removeButton.title = 'Remove image';
        removeButton.className = 'remove_image_button';
        removeButton.onclick = () => removeSelectedImage(file);

        previewWrapper.appendChild(image);
        previewWrapper.appendChild(removeButton);
        previewArea.appendChild(previewWrapper);
    }
}

    function removeSelectedImage(fileToRemove) {
    const fileIndex = selectedFiles.indexOf(fileToRemove);
        if (fileIndex !== -1) {
            selectedFiles.splice(fileIndex, 1);
}

    renderSelectedImages();
}
