(function () {
  'use strict';

  var STORAGE_KEY = 'hw_cv_data';
  var DRAFTS_KEY = 'hw_cv_drafts';
  var MAX_DRAFTS = 15;
  var MAX_ITEMS = 30;
  var TEMPLATES = ['modern', 'executive', 'tech', 'serif', 'compact'];
  var TEXT_FIELDS = [
    'fullName', 'jobTitle', 'email', 'phone', 'location', 'website',
    'summary', 'languages', 'certifications'
  ];
  var FIELD_LIMITS = {
    fullName: 200,
    jobTitle: 200,
    email: 300,
    phone: 80,
    location: 200,
    website: 500,
    summary: 6000,
    languages: 1000,
    certifications: 3000
  };

  var DEMO_DATA = {
    fullName: 'Carlos Eduardo Mendoza',
    jobTitle: 'Ingeniero de Software Senior',
    email: 'carlos.mendoza@email.com',
    phone: '+58 412 9876543',
    location: 'Caracas, Venezuela',
    website: 'https://linkedin.com/in/carlosmendoza',
    summary: 'Ingeniero de Software con más de 6 años de experiencia diseñando y construyendo aplicaciones web escalables. Especializado en JavaScript/TypeScript, React, Node.js y arquitectura Cloud. Apasionado por el código limpio y la optimización de rendimiento.',
    photo: '',
    template: 'modern',
    primaryColor: '#10b981',
    secondaryColor: '#1f2937',
    experiences: [
      {
        id: 1,
        company: 'Tech Solutions Inc.',
        position: 'Líder Técnico Frontend',
        period: '2022 - Presente',
        description: 'Liderazgo de equipo de 5 desarrolladores en la creación de plataformas SaaS. Optimización de tiempos de carga en un 40% y migraciones hacia React/Next.js.'
      },
      {
        id: 2,
        company: 'Innovación Digital C.A.',
        position: 'Desarrollador Web Full Stack',
        period: '2019 - 2022',
        description: 'Desarrollo de REST APIs robustas con Node.js y Express. Creación de interfaces responsivas e integración con pasarelas de pago.'
      }
    ],
    education: [
      {
        id: 1,
        institution: 'Universidad Central de Venezuela',
        degree: 'Ingeniería en Computación',
        period: '2014 - 2019'
      }
    ],
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Tailwind CSS', 'Git', 'Docker'],
    languages: 'Español (Nativo), Inglés (C1 Avanzado)',
    certifications: 'AWS Certified Developer, Scrum Master PSM I'
  };

  var SAMPLE_DATA = {
    fullName: 'Laura Sofía Gómez',
    jobTitle: 'Diseñadora UX/UI & Product Designer',
    email: 'laura.gomez@ejemplo.com',
    phone: '+58 414 5556677',
    location: 'Medellín, Colombia',
    website: 'https://behance.net/lauragomez',
    summary: 'Diseñadora de productos digitales con pasión por la creación de sistemas de diseño inclusivos y accesibles. Experiencia liderando proyectos ágiles.',
    photo: '',
    template: 'modern',
    primaryColor: '#10b981',
    secondaryColor: '#1f2937',
    experiences: [
      {
        id: 1,
        company: 'Studio Design Co.',
        position: 'Senior UX Designer',
        period: '2021 - Presente',
        description: 'Creación de prototipos de alta fidelidad y pruebas con usuarios para aplicaciones móviles con más de 100k usuarios activos.'
      }
    ],
    education: [
      {
        id: 1,
        institution: 'Universidad Nacional',
        degree: 'Licenciatura en Diseño Gráfico',
        period: '2015 - 2020'
      }
    ],
    skills: ['Figma', 'Design Systems', 'Prototipado', 'User Research', 'HTML/CSS'],
    languages: 'Español (Nativo), Inglés (B2)',
    certifications: 'Google UX Design Professional Certificate'
  };

  var cvData = emptyData();
  var savedDrafts = [];
  var syncTimer = null;
  var nextItemId = Date.now();
  var isExporting = false;
  var quotaWarningShown = false;
  var fitFrame = null;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    savedDrafts = loadDrafts();
    var stored = window.HW && HW.safeGetJSON ? HW.safeGetJSON(STORAGE_KEY, null) : null;
    cvData = stored && typeof stored === 'object' && !Array.isArray(stored)
      ? normalizeData(stored)
      : clone(DEMO_DATA);

    bindEvents();
    populateForm();
    persist();
    renderCV();

    window.addEventListener('resize', scheduleFit);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleFit).catch(function () {});
    }
  }

  function bindEvents() {
    TEXT_FIELDS.forEach(function (field) {
      var el = byId(field);
      if (!el) return;
      el.addEventListener('input', function () {
        cvData[field] = el.value;
        scheduleSync();
      });
    });

    byId('templateSelect').addEventListener('change', function (event) {
      cvData.template = validTemplate(event.target.value);
      syncNow();
    });

    ['primaryColorPicker', 'secondaryColorPicker'].forEach(function (id) {
      byId(id).addEventListener('input', function () {
        cvData.primaryColor = normalizeColor(byId('primaryColorPicker').value, '#10b981');
        cvData.secondaryColor = normalizeColor(byId('secondaryColorPicker').value, '#1f2937');
        scheduleSync(true);
      });
    });

    byId('photoInput').addEventListener('change', handlePhotoUpload);
    byId('removePhotoBtn').addEventListener('click', removePhoto);
    byId('addExperienceBtn').addEventListener('click', addExperience);
    byId('addEducationBtn').addEventListener('click', addEducation);
    byId('addSkillBtn').addEventListener('click', addSkillFromInput);
    byId('skillInput').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        addSkillFromInput();
      }
    });

    byId('jsonFileInput').addEventListener('change', handleJsonImport);
    byId('exportJsonBtn').addEventListener('click', exportJSON);
    byId('sampleJsonBtn').addEventListener('click', downloadSampleJSON);
    byId('loadDemoBtn').addEventListener('click', loadDemoData);
    byId('clearAllBtn').addEventListener('click', clearAll);

    byId('historyBtn').addEventListener('click', openHistory);
    byId('saveDraftBtn').addEventListener('click', saveCurrentDraft);

    byId('previewBtn').addEventListener('click', openPreview);
    byId('expandPreviewBtn').addEventListener('click', openPreview);
    byId('exportPdfBtn').addEventListener('click', exportToPDF);
    byId('exportPdfModalBtn').addEventListener('click', exportToPDF);
    byId('printBtn').addEventListener('click', printDocument);
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function emptyData() {
    return {
      fullName: '',
      jobTitle: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      summary: '',
      photo: '',
      template: 'modern',
      primaryColor: '#10b981',
      secondaryColor: '#1f2937',
      experiences: [],
      education: [],
      skills: [],
      languages: '',
      certifications: ''
    };
  }

  function textValue(value, limit) {
    if (typeof value !== 'string') return '';
    return limit ? value.slice(0, limit) : value;
  }

  function normalizeColor(value, fallback) {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  }

  function validTemplate(value) {
    return TEMPLATES.indexOf(value) !== -1 ? value : 'modern';
  }

  function normalizePhoto(value) {
    if (typeof value !== 'string') return '';
    if (value.length > 3000000) return '';
    return /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i.test(value) ? value : '';
  }

  function freshId() {
    nextItemId += 1;
    return nextItemId;
  }

  function normalizeId(value, used) {
    var id = Number(value);
    if (!isFinite(id) || id <= 0 || used[id]) id = freshId();
    used[id] = true;
    return id;
  }

  function normalizeData(raw) {
    raw = raw && typeof raw === 'object' ? raw : {};
    var data = emptyData();
    var usedExperienceIds = {};
    var usedEducationIds = {};

    TEXT_FIELDS.forEach(function (field) {
      data[field] = textValue(raw[field], FIELD_LIMITS[field]);
    });

    data.template = validTemplate(raw.template);
    data.primaryColor = normalizeColor(raw.primaryColor, '#10b981');
    data.secondaryColor = normalizeColor(raw.secondaryColor, '#1f2937');
    data.photo = normalizePhoto(raw.photo);

    data.experiences = Array.isArray(raw.experiences)
      ? raw.experiences.slice(0, MAX_ITEMS).map(function (item) {
          item = item && typeof item === 'object' ? item : {};
          return {
            id: normalizeId(item.id, usedExperienceIds),
            company: textValue(item.company, 200),
            position: textValue(item.position, 200),
            period: textValue(item.period, 100),
            description: textValue(item.description, 3000)
          };
        })
      : [];

    data.education = Array.isArray(raw.education)
      ? raw.education.slice(0, MAX_ITEMS).map(function (item) {
          item = item && typeof item === 'object' ? item : {};
          return {
            id: normalizeId(item.id, usedEducationIds),
            institution: textValue(item.institution, 250),
            degree: textValue(item.degree, 250),
            period: textValue(item.period, 100)
          };
        })
      : [];

    data.skills = Array.isArray(raw.skills)
      ? raw.skills
          .slice(0, 40)
          .map(function (skill) { return textValue(skill, 80).trim(); })
          .filter(Boolean)
      : [];

    return data;
  }

  function populateForm() {
    TEXT_FIELDS.forEach(function (field) {
      var el = byId(field);
      if (el) el.value = cvData[field] || '';
    });

    byId('templateSelect').value = cvData.template;
    byId('primaryColorPicker').value = cvData.primaryColor;
    byId('secondaryColorPicker').value = cvData.secondaryColor;

    refreshPhotoPreview();
    renderExperienceList();
    renderEducationList();
    renderSkillsList();
    renderCV();
  }

  function refreshPhotoPreview() {
    var img = byId('photoPreview');
    var placeholder = byId('photoPlaceholder');
    if (cvData.photo) {
      img.src = cvData.photo;
      img.classList.remove('d-none');
      placeholder.classList.add('d-none');
    } else {
      img.removeAttribute('src');
      img.classList.add('d-none');
      placeholder.classList.remove('d-none');
    }
  }

  function scheduleSync(immediate) {
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }

    if (immediate) {
      persist();
      renderCV();
      return;
    }

    syncTimer = setTimeout(function () {
      syncTimer = null;
      persist();
      renderCV();
    }, 100);
  }

  function syncNow() {
    scheduleSync(true);
  }

  function persist() {
    if (!window.HW || !HW.persist || !HW.persist.set) return;
    var ok = HW.persist.set(STORAGE_KEY, cvData);
    if (!ok && !quotaWarningShown) {
      quotaWarningShown = true;
      showToast('No se pudo guardar el CV en este navegador. Revisa el espacio disponible.', true);
    }
  }

  function showToast(message, isError) {
    if (window.HW && HW.toast) {
      HW.toast(message, isError);
      return;
    }
    if (isError) console.error(message);
    else console.info(message);
  }

  function handlePhotoUpload(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;

    if (!/^image\//i.test(file.type)) {
      showToast('Selecciona un archivo de imagen válido.', true);
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      showToast('La imagen supera los 12 MB. Elige una más liviana.', true);
      return;
    }

    optimizePhoto(file).then(function (dataUrl) {
      cvData.photo = dataUrl;
      refreshPhotoPreview();
      syncNow();
      showToast('Foto actualizada.');
    }).catch(function (error) {
      console.error(error);
      showToast('No se pudo procesar la imagen seleccionada.', true);
    });
  }

  function optimizePhoto(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        var image = new Image();
        image.onerror = reject;
        image.onload = function () {
          try {
            var maxSide = 640;
            var scale = Math.min(1, maxSide / Math.max(image.width, image.height));
            var width = Math.max(1, Math.round(image.width * scale));
            var height = Math.max(1, Math.round(image.height * scale));
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var context = canvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.86));
          } catch (error) {
            reject(error);
          }
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto() {
    cvData.photo = '';
    refreshPhotoPreview();
    syncNow();
  }

  function renderExperienceList() {
    var container = byId('experienceContainer');
    container.replaceChildren();

    if (!cvData.experiences.length) {
      var empty = document.createElement('p');
      empty.className = 'cv-empty-hint mb-0';
      empty.textContent = 'Todavía no agregaste puestos.';
      container.appendChild(empty);
      return;
    }

    cvData.experiences.forEach(function (experience, index) {
      var item = document.createElement('div');
      item.className = 'cv-dynamic-item';
      item.innerHTML =
        '<div class="cv-dynamic-head">' +
          '<span class="cv-dynamic-label"></span>' +
          '<button type="button" class="btn btn-sm btn-outline-danger" data-action="remove">' +
            '<i class="bi bi-trash3"></i><span class="visually-hidden">Eliminar puesto</span>' +
          '</button>' +
        '</div>' +
        '<div class="row g-2">' +
          '<div class="col-md-6">' +
            '<label class="form-label small">Empresa</label>' +
            '<input type="text" class="form-control form-control-sm" data-field="company" placeholder="Empresa">' +
          '</div>' +
          '<div class="col-md-6">' +
            '<label class="form-label small">Cargo</label>' +
            '<input type="text" class="form-control form-control-sm" data-field="position" placeholder="Cargo o puesto">' +
          '</div>' +
          '<div class="col-12">' +
            '<label class="form-label small">Período</label>' +
            '<input type="text" class="form-control form-control-sm" data-field="period" placeholder="Ej. 2022 - Presente">' +
          '</div>' +
          '<div class="col-12">' +
            '<label class="form-label small">Descripción de logros y funciones</label>' +
            '<textarea class="form-control form-control-sm" rows="2" data-field="description" placeholder="Logros, responsabilidades y resultados."></textarea>' +
          '</div>' +
        '</div>';

      item.querySelector('.cv-dynamic-label').textContent = 'Puesto #' + (index + 1);
      item.querySelector('[data-field="company"]').value = experience.company;
      item.querySelector('[data-field="position"]').value = experience.position;
      item.querySelector('[data-field="period"]').value = experience.period;
      item.querySelector('[data-field="description"]').value = experience.description;

      item.querySelectorAll('[data-field]').forEach(function (input) {
        input.addEventListener('input', function () {
          updateExperienceItem(experience.id, input.getAttribute('data-field'), input.value);
        });
      });

      item.querySelector('[data-action="remove"]').addEventListener('click', function () {
        removeExperience(experience.id);
      });

      container.appendChild(item);
    });
  }

  function renderEducationList() {
    var container = byId('educationContainer');
    container.replaceChildren();

    if (!cvData.education.length) {
      var empty = document.createElement('p');
      empty.className = 'cv-empty-hint mb-0';
      empty.textContent = 'Todavía no agregaste estudios.';
      container.appendChild(empty);
      return;
    }

    cvData.education.forEach(function (education, index) {
      var item = document.createElement('div');
      item.className = 'cv-dynamic-item';
      item.innerHTML =
        '<div class="cv-dynamic-head">' +
          '<span class="cv-dynamic-label"></span>' +
          '<button type="button" class="btn btn-sm btn-outline-danger" data-action="remove">' +
            '<i class="bi bi-trash3"></i><span class="visually-hidden">Eliminar estudio</span>' +
          '</button>' +
        '</div>' +
        '<div class="row g-2">' +
          '<div class="col-md-6">' +
            '<label class="form-label small">Institución</label>' +
            '<input type="text" class="form-control form-control-sm" data-field="institution" placeholder="Universidad o institución">' +
          '</div>' +
          '<div class="col-md-6">' +
            '<label class="form-label small">Título obtenido</label>' +
            '<input type="text" class="form-control form-control-sm" data-field="degree" placeholder="Título o grado">' +
          '</div>' +
          '<div class="col-12">' +
            '<label class="form-label small">Período</label>' +
            '<input type="text" class="form-control form-control-sm" data-field="period" placeholder="Ej. 2015 - 2020">' +
          '</div>' +
        '</div>';

      item.querySelector('.cv-dynamic-label').textContent = 'Estudio #' + (index + 1);
      item.querySelector('[data-field="institution"]').value = education.institution;
      item.querySelector('[data-field="degree"]').value = education.degree;
      item.querySelector('[data-field="period"]').value = education.period;

      item.querySelectorAll('[data-field]').forEach(function (input) {
        input.addEventListener('input', function () {
          updateEducationItem(education.id, input.getAttribute('data-field'), input.value);
        });
      });

      item.querySelector('[data-action="remove"]').addEventListener('click', function () {
        removeEducation(education.id);
      });

      container.appendChild(item);
    });
  }

  function addExperience() {
    cvData.experiences.push({
      id: freshId(),
      company: '',
      position: '',
      period: '',
      description: ''
    });
    renderExperienceList();
    syncNow();
    var inputs = byId('experienceContainer').querySelectorAll('[data-field="company"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }

  function updateExperienceItem(id, field, value) {
    var item = cvData.experiences.find(function (experience) { return experience.id === id; });
    if (!item) return;
    item[field] = value;
    scheduleSync();
  }

  function removeExperience(id) {
    cvData.experiences = cvData.experiences.filter(function (experience) { return experience.id !== id; });
    renderExperienceList();
    syncNow();
  }

  function addEducation() {
    cvData.education.push({
      id: freshId(),
      institution: '',
      degree: '',
      period: ''
    });
    renderEducationList();
    syncNow();
    var inputs = byId('educationContainer').querySelectorAll('[data-field="institution"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  }

  function updateEducationItem(id, field, value) {
    var item = cvData.education.find(function (education) { return education.id === id; });
    if (!item) return;
    item[field] = value;
    scheduleSync();
  }

  function removeEducation(id) {
    cvData.education = cvData.education.filter(function (education) { return education.id !== id; });
    renderEducationList();
    syncNow();
  }

  function renderSkillsList() {
    var container = byId('skillsList');
    container.replaceChildren();

    if (!cvData.skills.length) {
      var empty = document.createElement('p');
      empty.className = 'cv-empty-hint mb-0';
      empty.textContent = 'Agrega habilidades para destacarlas en el CV.';
      container.appendChild(empty);
      return;
    }

    cvData.skills.forEach(function (skill, index) {
      var chip = document.createElement('span');
      chip.className = 'cv-skill-chip';
      chip.appendChild(document.createTextNode(skill));

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.setAttribute('aria-label', 'Eliminar habilidad ' + skill);
      remove.innerHTML = '<i class="bi bi-x-lg"></i>';
      remove.addEventListener('click', function () {
        cvData.skills.splice(index, 1);
        renderSkillsList();
        syncNow();
      });
      chip.appendChild(remove);
      container.appendChild(chip);
    });
  }

  function addSkillFromInput() {
    var input = byId('skillInput');
    var value = input.value.trim();
    if (!value) {
      input.focus();
      return;
    }

    var exists = cvData.skills.some(function (skill) {
      return skill.toLowerCase() === value.toLowerCase();
    });
    if (exists) {
      showToast('Esa habilidad ya está en la lista.', true);
      input.select();
      return;
    }

    cvData.skills.push(value.slice(0, 80));
    input.value = '';
    renderSkillsList();
    syncNow();
    input.focus();
  }

  function renderCV() {
    var html = renderTemplate(cvData.template);
    var primary = cvData.primaryColor;
    var secondary = cvData.secondaryColor;

    ['inlineCvPreview', 'modalCvPreview', 'printCvPreview'].forEach(function (id) {
      var paper = byId(id);
      if (!paper) return;
      paper.innerHTML = html;
      paper.style.setProperty('--cv-primary', primary);
      paper.style.setProperty('--cv-secondary', secondary);
      var rgb = hexToRgb(primary);
      paper.style.setProperty('--cv-primary-soft', 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.12)');
      paper.style.setProperty('--cv-primary-border', 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.3)');
    });

    scheduleFit();
  }

  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
  }

  function renderTemplate(template) {
    switch (template) {
      case 'executive': return renderExecutiveTemplate();
      case 'tech': return renderTechTemplate();
      case 'serif': return renderSerifTemplate();
      case 'compact': return renderCompactTemplate();
      case 'modern':
      default: return renderModernTemplate();
    }
  }

  function esc(value) {
    if (window.HW && HW.escapeHtml) return HW.escapeHtml(value == null ? '' : value);
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function nl2br(value) {
    return esc(value).replace(/\r?\n/g, '<br>');
  }

  function displayName(data) {
    return data.fullName.trim() || 'Tu Nombre';
  }

  function displayRole(data) {
    return data.jobTitle.trim() || 'Título Profesional';
  }

  function photoMarkup(data, className) {
    if (!data.photo) return '';
    return '<img class="cv-profile-photo ' + (className || '') + '" src="' + esc(data.photo) + '" alt="Foto de perfil">';
  }

  function renderContact(data, extraClass) {
    var items = [];
    if (data.email.trim()) items.push(['envelope', data.email]);
    if (data.phone.trim()) items.push(['telephone', data.phone]);
    if (data.location.trim()) items.push(['geo-alt', data.location]);
    if (data.website.trim()) items.push(['globe2', data.website]);

    if (!items.length) return '';

    return '<div class="cv-contact ' + (extraClass || '') + '">' +
      items.map(function (item) {
        return '<span><i class="bi bi-' + item[0] + '"></i>' + esc(item[1]) + '</span>';
      }).join('') +
    '</div>';
  }

  function hasContact(data) {
    return !!(data.email.trim() || data.phone.trim() || data.location.trim() || data.website.trim());
  }

  function renderSection(title, icon, content, extraClass, titleClass) {
    if (!content) return '';
    return '<section class="cv-section ' + (extraClass || '') + '">' +
      '<h2 class="cv-section-title ' + (titleClass || '') + '"><i class="bi bi-' + icon + '"></i>' + esc(title) + '</h2>' +
      content +
    '</section>';
  }

  function renderSummary(data, extraClass) {
    if (!data.summary.trim()) return '';
    return renderSection('Perfil profesional', 'person-lines-fill',
      '<p class="cv-summary ' + (extraClass || '') + '">' + nl2br(data.summary) + '</p>');
  }

  function renderExperience(data, extraClass) {
    if (!data.experiences.length) return '';
    var content = data.experiences.map(function (experience) {
      var description = experience.description.trim()
        ? '<p class="cv-entry-desc">' + nl2br(experience.description) + '</p>'
        : '';
      return '<div class="cv-entry ' + (extraClass || '') + '">' +
        '<div class="cv-entry-head">' +
          '<div>' +
            '<h3 class="cv-entry-title">' + esc(experience.position.trim() || 'Puesto') + '</h3>' +
            (experience.company.trim() ? '<p class="cv-entry-sub">' + esc(experience.company) + '</p>' : '') +
          '</div>' +
          (experience.period.trim() ? '<span class="cv-entry-period">' + esc(experience.period) + '</span>' : '') +
        '</div>' +
        description +
      '</div>';
    }).join('');

    return renderSection('Experiencia laboral', 'briefcase', content);
  }

  function renderEducation(data) {
    if (!data.education.length) return '';
    var content = data.education.map(function (education) {
      return '<div class="cv-entry">' +
        '<div class="cv-entry-head">' +
          '<div>' +
            '<h3 class="cv-entry-title">' + esc(education.degree.trim() || 'Formación') + '</h3>' +
            (education.institution.trim() ? '<p class="cv-entry-sub">' + esc(education.institution) + '</p>' : '') +
          '</div>' +
          (education.period.trim() ? '<span class="cv-entry-period">' + esc(education.period) + '</span>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    return renderSection('Educación', 'mortarboard', content);
  }

  function renderSkills(data) {
    if (!data.skills.length) return '';
    var content = '<div class="cv-tags">' +
      data.skills.map(function (skill) {
        return '<span class="cv-tag">' + esc(skill) + '</span>';
      }).join('') +
    '</div>';

    return renderSection('Habilidades', 'stars', content);
  }

  function renderTextSection(title, icon, value) {
    if (!value.trim()) return '';
    return renderSection(title, icon, '<p class="cv-text-line">' + nl2br(value) + '</p>');
  }

  function renderModernTemplate() {
    var data = cvData;
    return '<div class="cvt cvt--modern">' +
      '<header class="cv-modern-head">' +
        '<div class="cv-identity">' +
          '<h1 class="cv-name">' + esc(displayName(data)) + '</h1>' +
          '<p class="cv-role">' + esc(displayRole(data)) + '</p>' +
          renderContact(data) +
        '</div>' +
        photoMarkup(data) +
      '</header>' +
      renderSummary(data) +
      renderExperience(data) +
      '<div class="cv-modern-bottom">' +
        '<div>' + renderEducation(data) + '</div>' +
        '<div>' +
          renderSkills(data) +
          renderTextSection('Idiomas', 'translate', data.languages) +
          renderTextSection('Certificaciones', 'patch-check', data.certifications) +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderExecutiveTemplate() {
    var data = cvData;
    return '<div class="cvt cvt--executive">' +
      '<div class="cv-exec-bar"></div>' +
      '<header class="cv-exec-head">' +
        photoMarkup(data) +
        '<h1 class="cv-name">' + esc(displayName(data)) + '</h1>' +
        '<p class="cv-role">' + esc(displayRole(data)) + '</p>' +
        renderContact(data) +
      '</header>' +
      renderSummary(data, 'cv-exec-summary') +
      renderExperience(data, 'cv-exec-entry') +
      '<div class="cv-exec-bottom">' +
        '<div>' + renderEducation(data) + '</div>' +
        '<div>' +
          renderSkills(data) +
          renderTextSection('Idiomas', 'translate', data.languages) +
          renderTextSection('Certificaciones', 'patch-check', data.certifications) +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderTechTemplate() {
    var data = cvData;
    return '<div class="cvt cv-tech">' +
      '<header class="cv-tech-head">' +
        '<div class="cv-tech-dots"><span></span><span></span><span></span></div>' +
        '<h1 class="cv-name">&lt;' + esc(displayName(data)) + '&gt;</h1>' +
        '<p class="cv-role">// ' + esc(displayRole(data)) + '</p>' +
      '</header>' +
      renderContact(data, 'cv-tech-contact') +
      renderSummary(data) +
      renderExperience(data, 'cv-tech-entry') +
      '<div class="cv-grid-2">' +
        '<div>' + renderEducation(data) + '</div>' +
        '<div>' +
          renderSkills(data) +
          renderTextSection('Idiomas', 'translate', data.languages) +
          renderTextSection('Certificaciones', 'patch-check', data.certifications) +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderSerifTemplate() {
    var data = cvData;
    return '<div class="cvt cv-serif">' +
      '<header class="cv-serif-head">' +
        photoMarkup(data) +
        '<h1 class="cv-name">' + esc(displayName(data)) + '</h1>' +
        '<p class="cv-role">' + esc(displayRole(data)) + '</p>' +
        renderContact(data) +
      '</header>' +
      renderSummary(data) +
      renderExperience(data) +
      '<div class="cv-serif-bottom">' +
        '<div>' + renderEducation(data) + '</div>' +
        '<div>' +
          renderSkills(data) +
          renderTextSection('Idiomas', 'translate', data.languages) +
          renderTextSection('Certificaciones', 'patch-check', data.certifications) +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderCompactTemplate() {
    var data = cvData;
    return '<div class="cvt cv-compact">' +
      '<aside class="cv-compact-side">' +
        photoMarkup(data) +
        '<h1 class="cv-name">' + esc(displayName(data)) + '</h1>' +
        '<p class="cv-role">' + esc(displayRole(data)) + '</p>' +
        (hasContact(data) ? renderSection('Contacto', 'person-lines-fill', renderContact(data)) : '') +
        renderSkills(data) +
        renderTextSection('Idiomas', 'translate', data.languages) +
        renderTextSection('Certificaciones', 'patch-check', data.certifications) +
      '</aside>' +
      '<div class="cv-compact-main">' +
        renderSummary(data) +
        renderExperience(data) +
        renderEducation(data) +
      '</div>' +
    '</div>';
  }

  function scheduleFit() {
    if (fitFrame) cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(function () {
      fitFrame = null;
      fitPreview();
    });
  }

  function fitPreview() {
    var stage = byId('inlinePreviewStage');
    var paper = byId('inlineCvPreview');
    if (!stage || !paper || !stage.clientWidth) return;

    var available = Math.max(100, stage.clientWidth - 24);
    var scale = Math.min(1, available / paper.offsetWidth);
    paper.style.transform = scale < 1 ? 'scale(' + scale + ')' : '';
    stage.style.height = (paper.offsetHeight * scale + 24) + 'px';
  }

  function openPreview() {
    if (!window.bootstrap || !bootstrap.Modal) return;
    bootstrap.Modal.getOrCreateInstance(byId('previewModal')).show();
  }

  function waitForModal(modalElement) {
    if (modalElement.classList.contains('show')) return Promise.resolve();
    return new Promise(function (resolve) {
      var done = false;
      var finish = function () {
        if (done) return;
        done = true;
        resolve();
      };
      modalElement.addEventListener('shown.bs.modal', finish, { once: true });
      setTimeout(finish, 700);
    });
  }

  function setExporting(exporting) {
    isExporting = exporting;
    ['exportPdfBtn', 'exportPdfModalBtn'].forEach(function (id) {
      var button = byId(id);
      if (button) button.disabled = exporting;
    });
  }

  function exportToPDF() {
    if (isExporting) return;
    setExporting(true);
    openPreview();

    waitForModal(byId('previewModal')).then(function () {
      if (typeof html2pdf !== 'function') throw new Error('html2pdf no está disponible');
      var element = byId('modalCvPreview');
      var options = {
        margin: 0,
        filename: sanitizeFilename(cvData.fullName || 'Curriculum') + '_CV.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };
      return html2pdf().set(options).from(element).save();
    }).then(function () {
      showToast('PDF generado.');
    }).catch(function (error) {
      console.error(error);
      showToast('No se pudo generar el PDF automáticamente. Se abrió la impresión.', true);
      setTimeout(printDocument, 150);
    }).finally(function () {
      setExporting(false);
    });
  }

  function printDocument() {
    renderCV();
    setTimeout(function () { window.print(); }, 100);
  }

  function sanitizeFilename(value) {
    var name = String(value || 'Curriculum')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return name || 'Curriculum';
  }

  function downloadFile(filename, content, type) {
    var blob = new Blob([content], { type: type || 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  function exportJSON() {
    downloadFile(
      sanitizeFilename(cvData.fullName || 'CV') + '_datos.json',
      JSON.stringify(cvData, null, 2)
    );
    hideFileMenu();
    showToast('Borrador exportado.');
  }

  function downloadSampleJSON() {
    downloadFile('cv_ejemplo.json', JSON.stringify(normalizeData(SAMPLE_DATA), null, 2));
    hideFileMenu();
    showToast('Ejemplo JSON descargado.');
  }

  function handleJsonImport(event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    hideFileMenu();

    if (file.size > 3 * 1024 * 1024) {
      showToast('El archivo JSON es demasiado grande.', true);
      return;
    }

    var reader = new FileReader();
    reader.onerror = function () {
      showToast('No se pudo leer el archivo.', true);
    };
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error('El JSON debe ser un objeto.');
        }
        var merged = Object.assign({}, cvData, parsed);
        cvData = normalizeData(merged);
        populateForm();
        persist();
        showToast('Datos del CV importados.');
      } catch (error) {
        console.error(error);
        showToast('El archivo no contiene un JSON de CV válido.', true);
      }
    };
    reader.readAsText(file);
  }

  function loadDemoData() {
    cvData = normalizeData(clone(DEMO_DATA));
    populateForm();
    persist();
    hideFileMenu();
    showToast('Datos demo cargados.');
  }

  function clearAll() {
    if (!window.confirm('¿Quieres reiniciar el formulario? Se perderán los datos actuales.')) return;
    cvData = emptyData();
    populateForm();
    persist();
    hideFileMenu();
    showToast('Formulario reiniciado.');
  }

  function hideFileMenu() {
    if (!window.bootstrap || !bootstrap.Dropdown) return;
    var button = byId('fileMenuBtn');
    if (button) bootstrap.Dropdown.getOrCreateInstance(button).hide();
  }

  function loadDrafts() {
    var raw = window.HW && HW.safeGetJSON ? HW.safeGetJSON(DRAFTS_KEY, []) : [];
    if (!Array.isArray(raw)) return [];
    return raw.slice(0, MAX_DRAFTS).map(function (draft, index) {
      draft = draft && typeof draft === 'object' ? draft : {};
      var id = Number(draft.id);
      return {
        id: isFinite(id) && id > 0 ? id : Date.now() + index,
        name: textValue(draft.name, 100).trim() || 'Borrador',
        date: textValue(draft.date, 80),
        data: draft.data && typeof draft.data === 'object' ? normalizeData(draft.data) : emptyData()
      };
    });
  }

  function persistDrafts() {
    if (!window.HW || !HW.persist || !HW.persist.set) return false;
    return HW.persist.set(DRAFTS_KEY, savedDrafts);
  }

  function openHistory() {
    if (!window.bootstrap || !bootstrap.Modal) return;
    renderDraftsList();
    bootstrap.Modal.getOrCreateInstance(byId('historyModal')).show();
  }

  function saveCurrentDraft() {
    var input = byId('draftNameInput');
    var name = input.value.trim() || 'Borrador ' + new Date().toLocaleDateString('es-VE');

    savedDrafts.unshift({
      id: freshId(),
      name: name.slice(0, 100),
      date: new Date().toLocaleString('es-VE'),
      data: clone(cvData)
    });
    savedDrafts = savedDrafts.slice(0, MAX_DRAFTS);

    if (!persistDrafts()) {
      savedDrafts.shift();
      showToast('No se pudo guardar el borrador en este navegador.', true);
      return;
    }

    input.value = '';
    renderDraftsList();
    showToast('Borrador guardado.');
  }

  function renderDraftsList() {
    var container = byId('draftsList');
    container.replaceChildren();

    if (!savedDrafts.length) {
      var empty = document.createElement('p');
      empty.className = 'cv-empty-hint text-center mb-0';
      empty.textContent = 'No hay versiones guardadas todavía.';
      container.appendChild(empty);
      return;
    }

    savedDrafts.forEach(function (draft) {
      var item = document.createElement('div');
      item.className = 'cv-draft-item d-flex justify-content-between align-items-center gap-2';

      var info = document.createElement('div');
      info.className = 'min-w-0';
      var title = document.createElement('p');
      title.className = 'small fw-semibold mb-0 text-truncate';
      title.textContent = draft.name;
      var date = document.createElement('p');
      date.className = 'cv-hint mb-0';
      date.textContent = draft.date || 'Sin fecha';
      info.appendChild(title);
      info.appendChild(date);

      var actions = document.createElement('div');
      actions.className = 'd-flex gap-1 flex-shrink-0';

      var load = document.createElement('button');
      load.type = 'button';
      load.className = 'btn btn-outline-primary btn-sm';
      load.textContent = 'Cargar';
      load.addEventListener('click', function () { loadDraft(draft.id); });

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-outline-danger btn-sm';
      remove.setAttribute('aria-label', 'Eliminar borrador ' + draft.name);
      remove.innerHTML = '<i class="bi bi-trash3"></i>';
      remove.addEventListener('click', function () { deleteDraft(draft.id); });

      actions.appendChild(load);
      actions.appendChild(remove);
      item.appendChild(info);
      item.appendChild(actions);
      container.appendChild(item);
    });
  }

  function loadDraft(id) {
    var draft = savedDrafts.find(function (item) { return item.id === id; });
    if (!draft) return;
    cvData = normalizeData(clone(draft.data));
    populateForm();
    persist();
    if (window.bootstrap && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance(byId('historyModal')).hide();
    }
    showToast('Borrador cargado.');
  }

  function deleteDraft(id) {
    savedDrafts = savedDrafts.filter(function (draft) { return draft.id !== id; });
    persistDrafts();
    renderDraftsList();
    showToast('Borrador eliminado.');
  }
})();
