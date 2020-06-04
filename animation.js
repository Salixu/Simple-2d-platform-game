(function animation() {

  // 864x280
  const PILLGRIM_WIDTH = 108 // 864/8
  const PILLGRIM_HEIGHT = 140 //  280/2
  const BULLET_WIDTH = 23;
  const BULLET_HEIGHT = 24;


  var Animation = function(frame_set, delay) {

    this.count = 0; // Counts the number of game cycles since the last frame change.
    this.delay = delay; // The number of game cycles to wait until the next frame change.
    this.frame = 0; // The value in the sprite sheet of the sprite image / tile to display.
    this.frame_index = 0; // The frame's index in the current animation frame set.
    this.frame_set = frame_set; // The current animation frame set that holds sprite tile values.
    this.direction = 0;

  };

  Animation.prototype = {

    /* This changes the current animation frame set. For example, if the current
    set is [0, 1], and the new set is [2, 3], it changes the set to [2, 3]. It also
    sets the delay. */
    change: function(frame_set, delay = 15, direction) {

      if (this.frame_set != frame_set) { // If the frame set is different:

        this.count = 0; // Reset the count.
        this.delay = delay; // Set the delay.
        this.frame_index = 0; // Start at the first frame in the new frame set.
        this.frame_set = frame_set; // Set the new frame set.
        this.frame = this.frame_set[this.frame_index]; // Set the new frame value.
        this.direction = direction;

      }

    },
    /* Call this on each game cycle. */
    update: function() {

      this.count++; // Keep track of how many cycles have passed since the last frame change.

      if (this.count >= this.delay) { // If enough cycles have passed, we change the frame.

        this.count = 0; // Reset the count.
        /* If the frame index is on the last value in the frame set, reset to 0.
        If the frame index is not on the last value, just add 1 to it. */
        this.frame_index = (this.frame_index == this.frame_set.length - 1) ? 0 : this.frame_index + 1;
        this.frame = this.frame_set[this.frame_index]; // Change the current frame value.

      }

    }

  };

  var buffer, iteration = 1,
    controller, buffer2,
    display, loop, player, newBullet,
    render, resize, sprite_sheet,
    bullet_image, bullet, live_bullets,
    bullets_objects, live_objects_iteration = 0,
    endGame, renderSummary, alive = 1,
    seconds = 0,
    soldier_image, war_background, difficulty = 60,
    loopSummary, endgame = 0,
    display2;

  buffer = document.createElement("canvas").getContext("2d");
  buffer2 = document.createElement("canvas").getContext("2d");
  display = document.querySelector("canvas").getContext("2d");

  controller = {

    /* Now each key object knows its physical state as well as its active state.
    When a key is active it is used in the game logic, but its physical state is
    always recorded and never altered for reference. */
    left: {
      active: false,
      state: false
    },
    right: {
      active: false,
      state: false
    },
    up: {
      active: false,
      state: false
    },
    r: {
      active: false
    },

    keyUpDown: function(event) {

      /* Get the physical state of the key being pressed. true = down false = up*/
      var key_state = (event.type == "keydown") ? true : false;
      switch (event.keyCode) {

        case 37: // left key

          /* If the virtual state of the key is not equal to the physical state
          of the key, we know something has changed, and we must update the active
          state of the key. By doing this it prevents repeat firing of keydown events
          from altering the active state of the key. Basically, when you are jumping,
          holding the jump key down isn't going to work. You'll have to hit it every
          time, but only if you set the active key state to false when you jump. */
          if (controller.left.state != key_state) controller.left.active = key_state;
          controller.left.state = key_state; // Always update the physical state.

          break;
        case 38: // up key

          if (controller.up.state != key_state) controller.up.active = key_state;
          controller.up.state = key_state;

          break;
        case 39: // right key

          if (controller.right.state != key_state) controller.right.active = key_state;
          controller.right.state = key_state;

          break;

        case 82: // 'r' key
          controller.r.active = true;
          break;

      }
    }

  };

  //random function multiple usages in code
  function random(min, max) {
    var min = min;
    var max = max;
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /* The player object is just a rectangle with an animation object. */
  player = {

    animation: new Animation(),
    jumping: true,
    height: PILLGRIM_HEIGHT,
    width: PILLGRIM_WIDTH,
    x: 10,
    y: 0,
    x_velocity: 0,
    y_velocity: 0

  };


  /* The sprite sheet object holds the sprite sheet graphic and some animation frame
  sets. An animation frame set is just an array of frame values that correspond to
  each sprite image in the sprite sheet, just like a tile sheet and a tile map. */
  sprite_sheet = {

    frame_sets: [
      [0, 1, 2, 3, 4, 5, 6, 7],
      [0, 1, 2, 3, 4, 5, 6, 7],
      [0]
    ],
    image: new Image()

  };


  bullets_objects = [];
  live_bullets = [];
  bullet_image = {
    image: new Image()
  };

  soldier_image = {
    image: new Image()
  };

  loop = function() {
    if (alive == 1) {

      if (controller.up.active && !player.jumping) {

        controller.up.active = false;
        player.jumping = true;
        player.y_velocity -= 22;

      }

      if (controller.right.active) {

        player.animation.change(sprite_sheet.frame_sets[0], 10, 0);
        player.x_velocity += 0.35;

      }

      if (controller.left.active) {

        player.animation.change(sprite_sheet.frame_sets[1], 10, 1);
        player.x_velocity -= 0.35;

      }

      if (!controller.left.active && !controller.right.active) {

        player.animation.change(sprite_sheet.frame_sets[2], 20, 0);

      }

      player.y_velocity += 1.09;
      player.x += player.x_velocity;
      player.y += player.y_velocity;
      player.x_velocity *= 0.95;
      player.y_velocity *= 0.99;


      // bottom collision
      if (player.y + player.height > buffer.canvas.height) {

        player.jumping = false;
        player.y = buffer.canvas.height - player.height;
        player.y_velocity = 0;

      }

      // right and left sides collisions

      if (player.x <= 0) {
        player.x = 0;
      } else if (player.x >= buffer.canvas.width - 100) {
        player.x = buffer.canvas.width - 100;
      }

      //difficulty increase

      if (iteration > 500 && iteration < 1000) {
        difficulty = 50;
      } else if (iteration > 1000 && iteration < 1500) {
        difficulty = 40;
      } else if (iteration > 1500) {
        difficulty = 30;
      }

      //creating new bullets

      if (iteration > live_objects_iteration) {
        live_objects_iteration = live_objects_iteration + difficulty;
        var temp_random = random(0, 60);
        if (bullets_objects[temp_random].x < 0) {
          bullets_objects[temp_random] = {
            animation: new Animation(),
            height: BULLET_HEIGHT,
            width: BULLET_WIDTH,
            x: 1920,
            y: random(800, 980),
            x_velocity: 0,
          };
          live_bullets.push(bullets_objects[temp_random]);
        } else {
          live_bullets.push(bullets_objects[temp_random]);
        }
      }

      iteration++;
      //bullet movement and collision
      for (var i = 0; i < live_bullets.length; i++) {
        live_bullets[i].x_velocity -= 3;
        live_bullets[i].x += live_bullets[i].x_velocity;
        live_bullets[i].x_velocity *= 0.8;

        if (
          live_bullets[i].x > player.x &&
          live_bullets[i].x < player.x + player.width &&
          live_bullets[i].y > player.y &&
          live_bullets[i].y < player.y + player.height
        ) {
          alive = 0;

        }
      }
      player.animation.update();
      render();

      window.requestAnimationFrame(loop);


    } else {
      renderSummary();
    }
  };
  render = function() {

    //background
    buffer.fillStyle = "white";
    buffer.fillRect(0, 0, buffer.canvas.width, buffer.canvas.height);
    buffer.rect(20, 20, 150, 100);
    buffer.fillStyle = "black";
    buffer.font = "bold 68px Arial";
    buffer.fillText(seconds, 50, 50);

    //moving objects
    buffer.drawImage(sprite_sheet.image, player.animation.frame * PILLGRIM_WIDTH, player.animation.direction * PILLGRIM_HEIGHT,
      PILLGRIM_WIDTH, PILLGRIM_HEIGHT, Math.floor(player.x), Math.floor(player.y), PILLGRIM_WIDTH, PILLGRIM_HEIGHT);
    for (var i = 0; i < live_bullets.length; i++) {
      buffer.drawImage(bullet_image.image, Math.floor(live_bullets[i].x), live_bullets[i].y);
    }
    display.drawImage(buffer.canvas, 0, 0, buffer.canvas.width, buffer.canvas.height, 0, 0, display.canvas.width, display.canvas.height);

  };

  renderSummary = function() {
    buffer2.drawImage(soldier_image.image, 0, 0)
    buffer2.fillStyle = "yellow";
    buffer2.font = "bold 68px Arial";
    buffer2.fillText("Survived " + " for " + seconds + " seconds", 200, 150);
    buffer2.fillText("Press 'R' to restart", 600, 400);

    display.drawImage(buffer2.canvas, 0, 0, buffer2.canvas.width, buffer2.canvas.height, 0, 0, display.canvas.width, display.canvas.height);
    // void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
    endgame = 1;
    controller.r.active = false;
    window.requestAnimationFrame(loopSummary);
  }

  loopSummary = function() {
    if (endgame == 1) {
      if (controller.r.active) {
        endgame = 0;
        location.reload();
      }
      window.requestAnimationFrame(loopSummary);
    } else {
      endgame = 0;
    }
  }

  resize = function() {

    display.canvas.width = document.documentElement.clientWidth - 32;

    if (display.canvas.width > document.documentElement.clientHeight) {

      display.canvas.width = document.documentElement.clientHeight;

    }

    display.canvas.height = display.canvas.width * 0.5;

    display.imageSmoothingEnabled = false;

  };

  ////////////////////
  //// INITIALIZE ////
  ////////////////////

  buffer.canvas.width = 1920;
  buffer.canvas.height = 1024;

  buffer2.canvas.width = 1920;
  buffer2.canvas.height = 1024;

  window.addEventListener("resize", resize);

  window.addEventListener("keydown", controller.keyUpDown);
  window.addEventListener("keyup", controller.keyUpDown);
  window.addEventListener("r", controller.keyUpDown)


  resize();

  sprite_sheet.image.addEventListener("load", function(event) {
    setInterval(function() {
      seconds++;
    }, 1000);
    for (var i = 0; i < 60; i++) {
      bullets_objects.push(bullet = {
        animation: new Animation(),
        height: BULLET_HEIGHT,
        width: BULLET_WIDTH,
        x: 1920,
        y: random(800, 980),
        x_velocity: 0,
      });
    }
    console.log("animation");
    window.requestAnimationFrame(loop); // Start the game loop.

  });

  sprite_sheet.image.src = "images/pilgrim_animation.png";
  bullet_image.image.src = "images/bullet.png";
  soldier_image.image.src = "images/alone_soldier.jpg";


})();