document.addEventListener('DOMContentLoaded', () => {
  // Restore button
  let restoreButton = document.createElement('button');
  restoreButton.classList.add('btn', 'btn-danger', 'position-absolute');
  restoreButton.style.top = '20px';
  restoreButton.style.left = '20px';
  restoreButton.style.display = 'none';
  document.body.appendChild(restoreButton);

  // Create overlay and text elements
  let overlay = document.createElement('div');
  overlay.classList.add('fullscreen-overlay');
  document.body.appendChild(overlay);

  function showOverlay(title) {
    const overlay = document.getElementById(`overlay-${title}`);
    if (overlay) {
      overlay.classList.add('show');
    }
  }

  function hideOverlay() {
    document.querySelectorAll('.fullscreen-overlay').forEach(overlay => {
      overlay.classList.remove('show');
    });
  }


  const draggables = document.querySelectorAll('.draggable');

  draggables.forEach(draggable => {
    let velocityX = 0;
    let velocityY = 0;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let shiftX = 0;
    let shiftY = 0;
    let animationFrameId = null;
    const friction = 0.99;
    const bounceFactor = -0.5;
    const maxVelocity = 17;
    const holdThreshold = 700; // hold time
    let heldTimeout = null;
    let isHolding = false;
    let isDraggableEnabled = true; // Flag to disable dragging after hold

    restoreButton.addEventListener('click', () => {
      restoreOvals();
    });

    function getEventCoordinates(event) {
      if (event.touches) {
        return {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
      } else {
        return {
          x: event.clientX,
          y: event.clientY
        };
      }
    }

    draggable.addEventListener('mousedown', onDragStart);
    draggable.addEventListener('touchstart', onDragStart);

    function onDragStart(event) {
      if (!isDraggableEnabled) return; // Prevent dragging if disabled

      isDragging = true;
      const { x: startX, y: startY } = getEventCoordinates(event);

      // Calculate the shift (difference) between the mouse/touch point and the element's top-left corner
      const draggableRect = draggable.getBoundingClientRect();
      shiftX = startX - draggableRect.left;
      shiftY = startY - draggableRect.top;

      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      // Get overlay title from data attribute
      const overlayTitle = draggable.getAttribute('data-overlay');

      // Detect holding the oval without moving
      heldTimeout = setTimeout(() => {
        if (isDragging) { // Ensure it's still dragging when timeout completes
          isHolding = true;
          startBorder();
          releaseOval();
        }
      }, holdThreshold);

      function onMove(event) {
        const { x: currentX, y: currentY } = getEventCoordinates(event);

        updateVelocity(currentX, currentY);
        cancelHoldIfMoved();

        moveDraggable(currentX, currentY);
      }

      function updateVelocity(currentX, currentY) {
        // Calculate the velocity (change in position)
        velocityX = currentX - lastX;
        velocityY = currentY - lastY;

        // Apply the maximum velocity limit
        velocityX = Math.min(Math.max(velocityX, -maxVelocity), maxVelocity);
        velocityY = Math.min(Math.max(velocityY, -maxVelocity), maxVelocity);

        lastX = currentX;
        lastY = currentY;
      }

      function cancelHoldIfMoved() {
        if (isHolding) {
          cancelBorder();
        }
        clearTimeout(heldTimeout); // Cancel hold detection if moved
      }

      function moveDraggable(x, y) {
        let newLeft = x - shiftX;
        let newTop = y - shiftY;

        // Constrain within the page boundaries
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - draggable.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - draggable.offsetHeight));

        draggable.style.left = newLeft + 'px';
        draggable.style.top = newTop + 'px';
      }


      function onStop() {
        isDragging = false;
        cleanupEventListeners();
        clearTimeout(heldTimeout);

        if (isHolding) {
          handleHoldCompletion();
        } else {
          animateIfNotHeld();
        }
      }

      function cleanupEventListeners() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onStop);
        document.removeEventListener('touchend', onStop);
      }

      function handleHoldCompletion() {
        completeHold();
        showOverlay(overlayTitle);
      }

      function animateIfNotHeld() {
        animateThrow();
      }

      lastX = startX;
      lastY = startY;

      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove);
      document.addEventListener('mouseup', onStop);
      document.addEventListener('touchend', onStop);
      event.preventDefault();
    }

    function releaseOval() {
      isDragging = false; // End dragging

      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onStop);
      document.removeEventListener('touchend', onStop);

      isDraggableEnabled = false; // Disable further dragging until restored
    }

    function startBorder() {
      // Ensure the border is created only once
      let border = document.querySelector('.fill-border');
      if (!border) {
        border = document.createElement('div');
        border.classList.add('fill-border');
        document.body.appendChild(border);
      }

      setTimeout(() => {
        border.style.height = '100%';
        border.style.width = '100%';
        border.style.border = '10px solid white';
        border.style.position = 'absolute';
        border.style.top = '0';
        border.style.left = '0';
        border.style.boxSizing = 'border-box';
        border.style.transition = 'all 0.5s ease';
      }, 50);
    }

    function cancelBorder() {
      isHolding = false;
      const border = document.querySelector('.fill-border');
      if (border) {
        border.remove();
      }
    }

    function completeHold() {
      cancelBorder();
      draggables.forEach(oval => {
        oval.style.transition = 'opacity 0.3s';
        oval.style.opacity = '0';
        setTimeout(() => {
          oval.style.display = 'none';
        }, 300);
      });

      // Show restore button
      setTimeout(() => {
        restoreButton.style.display = 'block';
        restoreButton.style.zIndex = 3;
      }, 300);
    }

    function restoreOvals() {
      // Restore all ovals and reset their styles
      draggables.forEach(oval => {
        requestAnimationFrame(() => {
          oval.style.opacity = '1';
          oval.style.display = 'flex'; // Both changes applied together
        });
      });

      // Re-enable dragging
      isDraggableEnabled = true;

      // Hide restore button and remove border
      restoreButton.style.display = 'none';
      cancelBorder();
      hideOverlay();
    }

    function animateThrow() {
      if (!isDragging) {
        let currentX = parseFloat(draggable.style.left);
        let currentY = parseFloat(draggable.style.top);

        // Apply friction to velocity
        velocityX *= friction;
        velocityY *= friction;

        // Apply the maximum velocity limit
        velocityX = Math.min(Math.max(velocityX, -maxVelocity), maxVelocity);
        velocityY = Math.min(Math.max(velocityY, -maxVelocity), maxVelocity);

        // Update position based on velocity
        currentX += velocityX;
        currentY += velocityY;

        // Handle collision with the edges (bounce)
        if (currentX <= 0 || currentX + draggable.offsetWidth >= window.innerWidth) {
          velocityX *= bounceFactor;
          currentX = Math.max(0, Math.min(currentX, window.innerWidth - draggable.offsetWidth));
        }
        if (currentY <= 0 || currentY + draggable.offsetHeight >= window.innerHeight) {
          velocityY *= bounceFactor;
          currentY = Math.max(0, Math.min(currentY, window.innerHeight - draggable.offsetHeight));
        }

        // Update position
        draggable.style.left = currentX + 'px';
        draggable.style.top = currentY + 'px';

        // Continue animating if velocity is significant
        if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
          animationFrameId = requestAnimationFrame(animateThrow);
        } else {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      }
    }
  });
});
