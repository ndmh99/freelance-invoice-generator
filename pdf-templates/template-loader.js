(function() {
  'use strict';

  const templateFiles = [
    'modern',
    'classic', 
    'minimal',
    'bold',
  ];

  let loadedCount = 0;
  let failedCount = 0;
  const totalTemplates = templateFiles.length;

  function loadTemplate(filename) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `pdf-templates/templates/${filename}.js`;
      script.onload = () => {
        loadedCount++;
        console.log(`✓ Template loaded: ${filename} (${loadedCount}/${totalTemplates})`);
        resolve(filename);
      };
      script.onerror = () => {
        failedCount++;
        console.error(`✗ Failed to load template: ${filename}.js`);
        reject(new Error(`Failed to load ${filename}.js`));
      };
      document.head.appendChild(script);
    });
  }

  async function loadAllTemplates() {
    if (totalTemplates === 0) {
      console.log('No templates to load');
      window.dispatchEvent(new CustomEvent('templatesLoaded', { 
        detail: { loaded: 0, failed: 0, total: 0 } 
      }));
      return;
    }

    console.log(`Loading ${totalTemplates} PDF templates...`);

    for (const filename of templateFiles) {
      try {
        await loadTemplate(filename);
      } catch (error) {
        console.warn(`Skipping failed template: ${filename}`);
      }
    }

    console.log(`Template loading complete: ${loadedCount} loaded, ${failedCount} failed`);
    
    window.dispatchEvent(new CustomEvent('templatesLoaded', {
      detail: {
        loaded: loadedCount,
        failed: failedCount,
        total: totalTemplates,
        templates: templateFiles
      }
    }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllTemplates);
  } else {
    loadAllTemplates();
  }

  window.PDFLoader = {
    templateFiles: templateFiles,
    status: () => ({
      loaded: loadedCount,
      failed: failedCount,
      total: totalTemplates
    })
  };
})();
