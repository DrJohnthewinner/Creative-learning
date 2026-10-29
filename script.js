// Navigation & State Functions for Creative Learning

// Select Grade and transition
function selectGrade(grade) {
  localStorage.setItem('selectedGrade', grade);
  window.location.href = 'subjects.html';
}

// Navigation back to grade selection
function goBackToGradesPage() {
  window.location.href = 'landing.html';
}

// Navigate to Subject Page & Save Last Chosen Subject
function navigateToSubjectPage(subjectId) {
  localStorage.setItem('lastSubject', subjectId);
  window.location.href = `note.html?subject=${subjectId}`;
}

// Record recently viewed note for recently viewed strip & continue where left off
function recordRecentlyViewedNote(noteId, noteTopic, subjectId, grade) {
  try {
    const recent = JSON.parse(localStorage.getItem('recentlyViewedNotes') || '[]');
    // Filter out existing if re-visited
    const filtered = recent.filter(item => item.id !== noteId);
    
    // Unshift new item
    filtered.unshift({
      id: noteId,
      topic: noteTopic,
      subject: subjectId,
      grade: grade,
      timestamp: Date.now()
    });

    // Keep top 5 recently viewed
    const trimmed = filtered.slice(0, 5);
    localStorage.setItem('recentlyViewedNotes', JSON.stringify(trimmed));

    // Save exact position for "Continue where you left off"
    localStorage.setItem('lastState', JSON.stringify({
      grade: grade,
      subject: subjectId,
      noteId: noteId,
      noteTopic: noteTopic,
      timestamp: Date.now()
    }));
  } catch(e) {
    console.error("Error saving reading state:", e);
  }
}

// Global scroll to top helper
function initBackToTop() {
  let topBtn = document.getElementById('backToTopBtn');
  if (!topBtn) {
    topBtn = document.createElement('button');
    topBtn.id = 'backToTopBtn';
    topBtn.className = 'back-to-top-btn';
    topBtn.setAttribute('aria-label', 'Back to top');
    topBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(topBtn);

    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      topBtn.classList.add('visible');
    } else {
      topBtn.classList.remove('visible');
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  initBackToTop();
});
