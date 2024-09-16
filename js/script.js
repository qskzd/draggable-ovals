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
  const bounceFactor = -0.8;
  const maxVelocity = 15;
  const holdThreshold = 500; // 0.5 seconds hold time
  const completeHoldThreshold = 1000; // 1 second to complete hold
  let heldTimeout = null;
  let isHolding = false;

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

    // Detect holding the oval without moving
    heldTimeout = setTimeout(() => {
      isHolding = true;
      startDimming();
    }, holdThreshold);

    function moveAt(pageX, pageY) {
      let newLeft = pageX - shiftX;
      let newTop = pageY - shiftY;

      // Constrain within the page boundaries
      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - draggable.offsetWidth));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - draggable.offsetHeight));

      draggable.style.left = newLeft + 'px';
      draggable.style.top = newTop + 'px';
    }

    function onMove(event) {
      const { x: currentX, y: currentY } = getEventCoordinates(event);

      // Calculate the velocity (change in position)
      velocityX = currentX - lastX;
      velocityY = currentY - lastY;

      // Apply the maximum velocity limit
      velocityX = Math.min(Math.max(velocityX, -maxVelocity), maxVelocity);
      velocityY = Math.min(Math.max(velocityY, -maxVelocity), maxVelocity);

      lastX = currentX;
      lastY = currentY;

      // Cancel hold and dimming if moved
      if (isHolding) {
        cancelDimming();
      }
      clearTimeout(heldTimeout); // Cancel hold detection if moved

      // Move the draggable element
      moveAt(currentX, currentY);
    }

    function onStop() {
      isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onStop);
      document.removeEventListener('touchend', onStop);

      clearTimeout(heldTimeout);

      // If holding completed, animate the disappearance of other ovals
      if (!isHolding) {
        animateThrow();
      } else {
        setTimeout(() => {
          completeHold();
        }, completeHoldThreshold);
      }
    }

    lastX = startX;
    lastY = startY;

    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('mouseup', onStop);
    document.addEventListener('touchend', onStop);
    event.preventDefault();
  }

  function startDimming() {
    document.body.style.transition = 'background-color 0.5s ease';
    document.body.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    const border = document.createElement('div');
    border.classList.add('fill-border');
    document.body.appendChild(border);
    setTimeout(() => {
      border.style.height = '100%';
    }, 50); // Trigger transition
  }

  function cancelDimming() {
    isHolding = false;
    document.body.style.backgroundColor = ''; // Remove dimming
    const border = document.querySelector('.fill-border');
    if (border) {
      border.remove();
    }
  }

  function completeHold() {
    cancelDimming();
    draggables.forEach(oval => {
      if (oval !== draggable) {
        oval.style.transition = 'opacity 1s';
        oval.style.opacity = '0';
        setTimeout(() => {
          oval.remove();
        }, 1000);
      }
    });
  }

  function animateThrow() {
    if (!isDragging) {
      let currentX = parseFloat(draggable.style.left) || 0;
      let currentY = parseFloat(draggable.style.top) || 0;

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
      }
    }
  }
});
