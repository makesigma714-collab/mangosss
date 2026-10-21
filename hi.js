/*
 * "Recte" / "Vecte" v1.0.0 – cheat userscript for a Unity WebGL + Colyseus FPS (weapon list suggests Kour.io)
 * ---------------------------------------------------------------------------------------------------------
 * Deobfuscated from original_obfuscated.js (JS-Confuser-style output). Nothing from the obfuscated file was
 * executed: every decoder (LZString string table, 75 custom-alphabet base91 string decoders, constant array,
 * dispatchers, calculator) was re-implemented / resolved statically with Babel.
 *
 * Obfuscation layers removed
 *   - duplicate-literal constant array (6836 entries)                 -> literals inlined
 *   - LZString-compressed string table (6104 entries)                 -> strings inlined
 *   - string concealing: 75 base91 decoders + per-call caches          -> 36977 strings inlined
 *   - "AST scrambler" no-op calls  nOKkzP(a, b, c)                    -> plain statements
 *   - 4 dispatcher functions (MsQ4Pq & 3 nested), 18 dispatched bodies -> normal functions + direct calls
 *     (one dispatched body that nothing called was dropped)
 *   - calculator helper c0jhxS("ujimily"|"j6cM1VM"|"ZiO3_2", a, b)      -> a / b, a + b, a - b (folded)
 *   - opaque predicates  if ("CQjcHvZ" in xYxIJS) {...}  (xYxIJS is an empty function, always false)
 *     and the 20+ junk functions they guarded (N-Queens / combination-sum solvers, fake regex strings)
 *   - "moved declarations" (locals / helper functions hidden as extra trailing parameters)
 *   - preserveFunctionLength helper tSFuhd (Object.defineProperty(fn, "length", ...))
 *   - global-object getter (globalThis / global / window / new Function("return this")()) and the
 *     TextDecoder/Buffer/fallback UTF-8 decoder – only used by the string decoders
 *   - the embedded LZString library and its UMD export (define / module.exports / angular.module("LZString"))
 *   - minifier artefacts (sequence expressions, && / || / ?: used as statements, "" + x template lowering,
 *     new RegExp("...") for regex literals, obj["prop"] access, hex/!0/!1/void 0 literals)
 *   - every identifier was renamed: IL2CPP wrapper classes after the type they call, the rest by purpose
 *     where it is clear (generic names otherwise)
 *
 * Anti-analysis code: none present (no debugger traps, devtools detection, console clearing, integrity /
 * self-defending checks or timing checks were found in any layer).
 *
 * Note on the input: the pasted copy had 9 non-breaking spaces (U+00A0) turned into normal spaces inside the
 * LZString payload (the obfuscator escapes every ASCII character there, so every raw space was one of them).
 * They were restored before decompression; with them restored every string decodes cleanly.
 *
 * External runtime this script expects (not part of this file): window.ctx – an IL2CPP/WASM bridge that
 * provides call(type, method, args), hookPrefix({typeName, methodName, params}, cb), malloc(n),
 * createMstr(str) and pointer objects with readField/writeField/val/mstr/getClassName – and window.unityInstance.
 */
(() => {

  // ===== Functions recovered from the JS-Confuser dispatcher (msgpack helpers + cheat routines) =====
  function utf8Count(str) {
    let strLength = str.length;
    let byteLength = 0;
    let pos = 0;
    while (pos < strLength) {
      let value = str.charCodeAt(pos++);
      if ((value & 0xffffff80) === 0) {
        byteLength++;
        continue;
      } else if ((value & 0xfffff800) === 0) {
        byteLength += 2;
      } else {
        if (value >= 55296 && value <= 56319 && pos < strLength) {
          let extra = str.charCodeAt(pos);
          if ((extra & 64512) === 56320) {
            ++pos;
            value = ((value & 1023) << 10) + (extra & 1023) + 65536;
          }
        }
        if ((value & 0xffff0000) === 0) {
          byteLength += 3;
        } else {
          byteLength += 4;
        }
      }
    }
    return byteLength;
  }
  function utf8EncodeJs(str, output, outputOffset) {
    let strLength = str.length;
    let offset = outputOffset;
    let pos = 0;
    while (pos < strLength) {
      let value = str.charCodeAt(pos++);
      if ((value & 0xffffff80) === 0) {
        output[offset++] = value;
        continue;
      } else if ((value & 0xfffff800) === 0) {
        output[offset++] = ((value >> 6) & 31) | 192;
      } else {
        if (value >= 55296 && value <= 56319 && pos < strLength) {
          let extra = str.charCodeAt(pos);
          if ((extra & 64512) === 56320) {
            ++pos;
            value = ((value & 1023) << 10) + (extra & 1023) + 65536;
          }
        }
        if ((value & 0xffff0000) === 0) {
          output[offset++] = ((value >> 12) & 15) | 224;
          output[offset++] = ((value >> 6) & 63) | 128;
        } else {
          output[offset++] = ((value >> 18) & 7) | 240;
          output[offset++] = ((value >> 12) & 63) | 128;
          output[offset++] = ((value >> 6) & 63) | 128;
        }
      }
      output[offset++] = (value & 63) | 128;
    }
  }
  function utf8DecodeTD(bytes, inputOffset, byteLength) {
    let stringBytes = bytes.subarray(inputOffset, inputOffset + byteLength);
    return sharedTextDecoder.decode(stringBytes);
  }
  function encodeTimeSpecToTimestamp({ sec: sec, nsec: nsec }) {
    if (sec >= 0 && nsec >= 0 && sec <= TIMESTAMP64_MAX_SEC) {
      if (nsec === 0 && sec <= TIMESTAMP32_MAX_SEC) {
        let rv = new Uint8Array(4);
        new DataView(rv.buffer).setUint32(0, sec);
        return rv;
      } else {
        let secHigh = sec / 4294967296;
        let secLow = sec & 0xffffffff;
        let rv = new Uint8Array(8);
        let view = new DataView(rv.buffer);
        view.setUint32(0, (nsec << 2) | (secHigh & 3));
        view.setUint32(4, secLow);
        return rv;
      }
    } else {
      let rv = new Uint8Array(12);
      let view = new DataView(rv.buffer);
      view.setUint32(0, nsec);
      setInt64(view, 4, sec);
      return rv;
    }
  }
  function prettyByte(byte) {
    return `${byte < 0 ? "-" : ""}0x${Math.abs(byte).toString(16).padStart(2, "0")}`;
  }
  function msgpackDecode(buffer, options) {
    return new Decoder(options).decode(buffer);
  }
  function getEspTextScale(headScreen, feetScreen) {
    let boxHeight = Math.abs(feetScreen.y - headScreen.y);
    return Math.max(0.6, Math.min(1.2, boxHeight / 120));
  }

  // Runs every animation frame from mainLoop(): draws the ESP overlay and drives the aimbot / target selection.
  function renderEspAndAimbot() {
    if (!document.getElementById("espcanvas")) {
      let newCanvas = document.createElement("canvas");
      newCanvas.id = "espcanvas";
      newCanvas.style.position = "fixed";
      newCanvas.style.top = "0";
      newCanvas.style.left = "0";
      newCanvas.style.pointerEvents = "none";
      newCanvas.style.zIndex = "99999999";
      document.body.appendChild(newCanvas);
    }
    onScreenTargets = [];
    let infoLines = [];
    aimTargetScreenDist = Infinity;
    aimTarget = null;
    let canvas = document.getElementById("espcanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let ctx2d = canvas.getContext("2d");
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    if (config.visuals.fov) {
      drawFovCircle(
        ctx2d,
        config.visuals.fovsize,
        config.visuals.fovrainbow ? rainbowColor() : config.visuals.fovcolor,
        2,
      );
    }
    if (!localShooterPtr) {
      return;
    }
    for (let player of players) {
      let headWorldPtr = new Vec3(player.pos.x, player.pos.y + 2.2, player.pos.z).createPtr();
      let feetWorldPtr = new Vec3(player.pos.x, player.pos.y, player.pos.z).createPtr();
      let chestWorldPtr = new Vec3(player.pos.x, player.pos.y + 1.5, player.pos.z).createPtr();
      let chestScreen = worldToScreen(canvas, chestWorldPtr);
      headpos = worldToScreen(canvas, headWorldPtr);
      feetpos = worldToScreen(canvas, feetWorldPtr);
      if (
        headpos.y < 0 ||
        feetpos.y < 0 ||
        headpos.y > canvas.height ||
        feetpos.y > canvas.height ||
        headpos.z < 0 ||
        feetpos.z < 0
      ) {
        onScreenTargets = onScreenTargets.filter((entry) => entry[0] !== player);
        continue;
      }
      if (onScreenTargets.findIndex((entry) => entry[0] === player) === -1) {
        onScreenTargets.push([player, chestScreen]);
      } else {
        let entryIndex = onScreenTargets.findIndex((entry) => entry[0] === player);
        onScreenTargets[entryIndex][1] = chestScreen;
      }
      let health = Math.min(new ColyBehaviour(player.shooter).colyView.playerState.health.val() - 65536, 150);
      let distance = localPlayer.pos.distance(player.pos);
      if (config.visuals.esp) {
        if (config.visuals.skeleton) {
          for (let [boneA, boneB] of SKELETON_LINKS) {
            try {
              let boneTransformA = player.transform.Find(ctx.createMstr(BONE_PATHS[boneA]));
              let boneTransformB = player.transform.Find(ctx.createMstr(BONE_PATHS[boneB]));
              if (
                !boneTransformA.ptr ||
                !boneTransformB.ptr ||
                boneTransformA.ptr.val() === 0 ||
                boneTransformB.ptr.val() === 0 ||
                boneTransformA.ptr.getClassName() !== "Transform" ||
                boneTransformB.ptr.getClassName() !== "Transform"
              ) {
                continue;
              }
              let boneScreenA = worldToScreen(canvas, boneTransformA.position);
              let boneScreenB = worldToScreen(canvas, boneTransformB.position);
              if (!boneScreenA || !boneScreenB) {
                continue;
              }
              drawLine(
                ctx2d,
                boneScreenA,
                boneScreenB,
                config.visuals.skeletonrainbow ? rainbowColor() : config.visuals.skeletoncolor,
                config.visuals.skeletonthickness,
              );
            } catch (err) {
              console.trace(err);
            }
          }
        }
        if (config.visuals.box) {
          if (config.visuals.boxrainbow) {
            drawBox(headpos, feetpos, ctx2d, config.visuals.boxthickness, rainbowColor());
          } else {
            drawBox(headpos, feetpos, ctx2d, config.visuals.boxthickness, config.visuals.boxcolor);
          }
        }
        if (config.visuals.cornerbox) {
          if (config.visuals.cornerboxrainbow) {
            drawCornerBox(headpos, feetpos, ctx2d, rainbowColor(), config.visuals.cornerboxthickness, false);
          } else {
            drawCornerBox(
              headpos,
              feetpos,
              ctx2d,
              config.visuals.cornerboxcolor,
              config.visuals.cornerboxthickness,
              false,
            );
          }
        }
        if (config.visuals.filledbox) {
          if (config.visuals.filledboxrainbow) {
            drawFilledBox(headpos, feetpos, ctx2d, rainbowColor());
          } else {
            drawFilledBox(headpos, feetpos, ctx2d, config.visuals.filledboxcolor);
          }
        }
        if (config.visuals.tracer) {
          tracerto = config.visuals.tracerto == "Feet" ? new Vec3(headpos.x, feetpos.y, 0) : headpos;
          tracerfrom =
            config.visuals.tracerfrom == "Bottom Center"
              ? new Vec3(canvas.width / 2, canvas.height, 0)
              : new Vec3(canvas.width / 2, 0, 0);
          if (config.visuals.tracerrainbow) {
            drawLine(ctx2d, tracerfrom, tracerto, rainbowColor(), config.visuals.tracerthickness);
          } else {
            drawLine(ctx2d, tracerfrom, tracerto, config.visuals.tracercolor, config.visuals.tracerthickness);
          }
        }
        if (config.visuals.name) {
          infoLines.push({
            text: player.name,
            size: config.visuals.namesize,
            color: config.visuals.namerainbow ? rainbowColor() : config.visuals.namecolor,
          });
        }
        if (config.visuals.distanceesp) {
          infoLines.push({
            text: distance,
            size: config.visuals.distancesize,
            color: config.visuals.distancerainbow ? rainbowColor() : config.visuals.distancecolor,
          });
        }
        if (config.visuals.gunesp) {
          let gunId = new ColyShooter(player.shooter).currentGun.id;
          infoLines.push({
            text: WEAPON_NAMES[gunId],
            size: config.visuals.gunespsize,
            color: config.visuals.gunrainbow ? rainbowColor() : config.visuals.gunespcolor,
          });
        }
        if (config.visuals.healthesp) {
          if (config.visuals.healthtext) {
            infoLines.push({
              text: health,
              size: config.visuals.healthespsize,
              color: config.visuals.healthesprainbow ? rainbowColor() : config.visuals.healthespcolor,
            });
          }
          if (config.visuals.healthbar) {
            drawHealthBar(headpos, feetpos, ctx2d, health, 150, 4);
          }
        }
        if (infoLines.length > 0) {
          if (config.visuals.userinfolocation === "Feet") {
            drawInfoLines(ctx2d, feetpos.x - 20, feetpos.y + 10, infoLines, getEspTextScale(headpos, feetpos), "down");
          } else {
            drawInfoLines(ctx2d, headpos.x - 20, headpos.y - 10, infoLines, getEspTextScale(headpos, feetpos), "up");
          }
          infoLines.length = 0;
        }
      }
      if (config.rage.playermagnet) {
        forwardptr = ctx.malloc(12);
        ctx.call("UnityEngine.Transform", "get_forward", [forwardptr, localPlayer.transform]);
        forward = Vec3.readFrom(forwardptr);
        forward.x = forward.x * config.rage.playermagnetdist + localPlayer.pos.x;
        forward.y = forward.y * config.rage.playermagnetdist + localPlayer.pos.y;
        forward.z = forward.z * config.rage.playermagnetdist + localPlayer.pos.z;
        new Transform(player.transform).position = forward.createPtr();
      }
    }
    crosshairTarget = null;
    let bestScreenDist = Infinity;
    let bestTarget = null;
    for (let [target, targetScreen] of onScreenTargets) {
      let screenDist = distanceFromScreenCenter(targetScreen);
      if (config.visuals.fov && screenDist > config.visuals.fovsize) {
        continue;
      }
      if (config.rage.stickytargeting && stickyTarget) {
        let stickyEntry = onScreenTargets.find((entry) => entry[0] === stickyTarget);
        if (stickyEntry) {
          let stickyScreenDist = distanceFromScreenCenter(stickyEntry[1]);
          if (screenDist > stickyScreenDist && screenDist < stickyScreenDist + 30) {
            bestTarget = stickyTarget;
            bestScreenDist = stickyScreenDist;
            break;
          }
        }
      }
      let targetHealth = Math.min(new ColyBehaviour(target.shooter).colyView.playerState.health.val() - 65536, 150);
      let targetDistance = localPlayer.pos.distance(target.pos);
      switch (config.rage.aimtype) {
        case "Center of screen":
          if (screenDist < bestScreenDist) {
            bestScreenDist = screenDist;
            bestTarget = target;
          }
          break;
        case "Lowest Health":
          if (!bestTarget) {
            bestTarget = target;
            bestScreenDist = screenDist;
          } else {
            let bestHealth = Math.min(
              new ColyBehaviour(bestTarget.shooter).colyView.playerState.health.val() - 65536,
              150,
            );
            if (targetHealth < bestHealth) {
              bestScreenDist = screenDist;
              bestTarget = target;
            }
          }
          break;
        case "Closest":
          if (!bestTarget) {
            bestTarget = target;
            bestScreenDist = screenDist;
          } else {
            let bestDistance = localPlayer.pos.distance(bestTarget.pos);
            if (targetDistance < bestDistance) {
              bestScreenDist = screenDist;
              bestTarget = target;
            }
          }
          break;
      }
      if (screenDist < 30) {
        crosshairTarget = target;
        if (config.rage.hovertokill) {
          new ColyShooter(localPlayer.shooter).SendRPCShoot(
            ctx.createMstr(target.sessionId),
            Vec3.zero().createPtr(),
            4,
            150,
            null,
            false,
          );
        }
      }
    }
    if (config.rage.stickytargeting) {
      stickyTarget = bestTarget;
      stickyTargetScreenDist = bestScreenDist;
    } else {
      stickyTarget = null;
      stickyTargetScreenDist = Infinity;
    }
    let nowMs = Date.now();
    if (bestTarget !== lockedTarget) {
      let sinceSwitch = nowMs - lastTargetSwitchTime;
      let switchIntervalMs = config.rage.targetswitchinterval * 1000;
      if (sinceSwitch >= switchIntervalMs) {
        lockedTarget = bestTarget;
        aimTargetScreenDist = bestScreenDist;
        aimTarget = bestTarget;
        lastTargetSwitchTime = nowMs;
      } else {
        aimTargetScreenDist = NO_TARGET_DIST;
        aimTarget = lockedTarget;
      }
    } else {
      aimTargetScreenDist = NO_TARGET_DIST;
      aimTarget = lockedTarget;
    }
    if (
      aimTarget &&
      (mouseButtons[config.rage.aimkey] || keysDown[config.rage.aimkey] || keysDown["Key" + config.rage.aimkey]) &&
      config.rage.aimbot &&
      config.rage.aimbottype === "Aimbot"
    ) {
      let boneYOffset = 0;
      switch (config.rage.aimbone) {
        case "Head":
          break;
        case "Legs":
          boneYOffset = -1.1;
          break;
        case "Body":
          boneYOffset = -0.6;
          break;
      }
      let delta = {
        x: aimTarget.pos.x - localPlayer.pos.x,
        y: aimTarget.pos.y + boneYOffset - localPlayer.pos.y,
        z: aimTarget.pos.z - localPlayer.pos.z,
      };
      let targetYaw = Math.atan2(delta.x, delta.z) * (180 / Math.PI);
      let horizontalDist = Math.sqrt(delta.x * delta.x + delta.z * delta.z);
      let targetPitch = Math.atan2(delta.y, horizontalDist) * (180 / Math.PI);
      targetPitch = Math.max(-90, Math.min(90, targetPitch));
      targetYaw = normalizeAngle(targetYaw);
      targetPitch = normalizeAngle(targetPitch);
      let currentYaw = normalizeAngle(localMovementController.currentYRot);
      let currentPitch = normalizeAngle(-new CharacterCamera(characterCameraPtr).xRot);
      yrot = lerpAngle(currentYaw, targetYaw, config.rage.aimspeed);
      xrot = -lerpAngle(currentPitch, targetPitch, config.rage.aimspeed);
      localMovementController.currentYRot = yrot;
      new CharacterCamera(characterCameraPtr).xRot = xrot;
    }
    onScreenTargets.length = 0;
  }
  function drawBox(headScreen, feetScreen, ctx2d, thickness, color) {
    let height = feetScreen.y - headScreen.y;
    let width = height * 0.6;
    let left = headScreen.x - width / 2;
    let top = headScreen.y;
    ctx2d.beginPath();
    ctx2d.rect(left, top, width, height);
    ctx2d.strokeStyle = color;
    ctx2d.lineWidth = thickness;
    ctx2d.stroke();
  }
  function drawFilledBox(headScreen, feetScreen, ctx2d, color) {
    let height = Math.abs(feetScreen.y - headScreen.y);
    let width = height * 0.6;
    let left = headScreen.x - width / 2;
    let top = headScreen.y;
    ctx2d.fillStyle = color;
    ctx2d.fillRect(left, top, width, height);
  }
  function installGunHooks() {
    window.ctx.hookPrefix(
      {
        typeName: "WorldFlash",
        methodName: "TryPlayFlashUI",
        params: ["i32", "f32", "i32"],
      },
      (worldFlash) => {
        if (config.visuals.hideflash) {
          return false;
        }
      },
    );
    window.ctx.hookPrefix(
      {
        typeName: "Gun",
        methodName: "ApplyRecoil",
        params: ["i32", "i32"],
      },
      (gunPtr) => {
        if (config.rage.norecoil) {
          return false;
        }
      },
    );
    window.ctx.hookPrefix(
      {
        typeName: "Gun",
        methodName: "Update",
        params: ["i32", "i32"],
      },
      (gunPtr) => {
        let gun = new Gun(gunPtr);
        let shooterPtr = gun.shooter.ptr;
        if (new ColyBehaviour(shooterPtr).IsMine) {
          localGunDamage = gun.GetBaseDamage() * (gun.damageRandom + 1);
          if (config.rage.triggerbot && crosshairTarget) {
            now = performance.now() / 1000;
            if (gun._currentAmmo >= 1 && now - lastTriggerbotShotTime >= gun.nextFireTime - gun.lastShotTime) {
              gun.Shoot(9999, crosshairTarget.pos.createPtr(), 4, "shoot");
              new ColyShooter(shooterPtr).SendRPCShoot(
                ctx.createMstr(crosshairTarget.sessionId),
                crosshairTarget.pos.createPtr(),
                4,
                localGunDamage,
                9999,
                false,
              );
              lastTriggerbotShotTime = now;
            }
          }
          if (config.rage.fastswitch) {
            gun.afterSwitchDontAllowShootFor = 0;
          }
          if (config.rage.nocooldown) {
            gun.nextRightClickTime = 0;
          }
          if (config.rage.infammo) {
            gun._currentAmmo = 10000;
          }
          if (config.rage.firerate) {
            gun.fireRate = 10000;
          }
          if (config.rage.autofire) {
            gun.holdToShoot = true;
          } else if (!gun.holdToShoot) {
            gun.holdToShoot = false;
          }
          if (config.rage.range) {
            gun.maxRange = 1000;
            gun.maxRangeDamage = 150;
          }
        }
      },
    );
  }
  function godModeSelf() {
    hitpos = Vec3.zero().createPtr();
    if (localPlayer) {
      new ColyShooter(localPlayer.shooter).SendRPCShoot(
        ctx.createMstr(localPlayer.sessionId),
        hitpos,
        4,
        -99999999,
        null,
        false,
      );
    }
  }
  function mainLoop(timestamp) {
    requestAnimationFrame(mainLoop);
    if (config.rage.chatspam && timestamp - lastChatSpamTime >= CHAT_SPAM_INTERVAL_MS) {
      window.unityInstance.SendMessage(
        "ChatUIManager",
        "SendChatMessage",
        "<b><size=300%><color=#4C0804><u><color=#4f0803>R<color=#50120d>E<color=#511c18>C<color=#522622>T<color=#52302d>E<color=#533a37>.<color=#544442>C<color=#554e4c>C<color=#FFF>/invite",
      );
      lastChatSpamTime = timestamp;
    }
    if (config.rage.roastall && timestamp - lastRoastTime >= ROAST_INTERVAL_MS) {
      window.unityInstance.SendMessage("ChatUIManager", "SendChatMessage", randomRoastMessage());
      lastRoastTime = timestamp;
    }
    if (keysDown[config.settings.godmodekey.toLowerCase()]) {
      if (!godmodeKeyLatched) {
        godModeSelf();
        godmodeKeyLatched = true;
      }
    } else {
      godmodeKeyLatched = false;
    }
    if (keysDown[config.settings.wallbangkey.toLowerCase()]) {
      if (!wallbangKeyLatched) {
        config.rage.shootthroughwalls = !config.rage.shootthroughwalls;
        menu.syncUI();
        wallbangKeyLatched = true;
      }
    } else {
      wallbangKeyLatched = false;
    }
    if (keysDown[config.settings.chamskey.toLowerCase()]) {
      if (!chamsKeyLatched) {
        config.visuals.chams = !config.visuals.chams;
        menu.syncUI();
        chamsKeyLatched = true;
      }
    } else {
      chamsKeyLatched = false;
    }
    if (keysDown[config.settings.espkey.toLowerCase()]) {
      if (!espKeyLatched) {
        config.visuals.esp = !config.visuals.esp;
        menu.syncUI();
        espKeyLatched = true;
      }
    } else {
      espKeyLatched = false;
    }
    if (keysDown[config.settings.loadoutkey.toLowerCase()]) {
      if (!loadoutKeyLatched) {
        applyLoadout();
        loadoutKeyLatched = true;
      }
    } else {
      loadoutKeyLatched = false;
    }
    if (keysDown[config.settings.inviskey.toLowerCase()]) {
      if (!invisKeyLatched) {
        config.rage.invis = !config.rage.invisibility;
        menu.syncUI();
        invisKeyLatched = true;
      }
    } else {
      invisKeyLatched = false;
    }
    if (keysDown[config.settings.flykey.toLowerCase()]) {
      if (!flyKeyLatched) {
        config.rage.fly = !config.rage.fly;
        menu.syncUI();
        flyKeyLatched = true;
      }
    } else {
      flyKeyLatched = false;
    }
    if (keysDown[config.settings.spinbotkey.toLowerCase()]) {
      if (!spinbotKeyLatched) {
        config.rage.spinbot = !config.rage.spinbot;
        menu.syncUI();
        spinbotKeyLatched = true;
      }
    } else {
      spinbotKeyLatched = false;
    }
    renderEspAndAimbot();
    if (!(timestamp - lastSpinbotTime < SPINBOT_INTERVAL_MS)) {
      lastSpinbotTime = timestamp;
      if (config.rage.spinbot) {
        sendSpinbotPacket();
      }
    }
  }

  // Called once at start-up: disables window.debugMode and deletes the "UnityCache" IndexedDB database.
  async function clearUnityCache() {
    window.debugMode = false;
    let request = indexedDB.open("UnityCache");
    request.onsuccess = () => {
      request.result.close();
      indexedDB.deleteDatabase("UnityCache");
    };
  }

  // ===== Auto-generated IL2CPP wrapper classes (game "SDK") =====
  // Each getter/setter/method either proxies window.ctx.call("<IL2CPP type>", "<method>", [this.ptr, ...])
  // or reads/writes a raw field at a fixed offset. Class names come from the IL2CPP type they call into;
  // empty classes are enum wrappers named after the property that returns them.
  class Gun {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get AIFireRate() {
      return window.ctx.call("Gun", "get_AIFireRate", [this.ptr]).val();
    }
    get aimDuration() {
      return window.ctx.call("Gun", "get_aimDuration", [this.ptr]).val();
    }
    get currentAmmo() {
      return window.ctx.call("Gun", "get_currentAmmo", [this.ptr]).val();
    }
    set currentAmmo(value) {
      window.ctx.call("Gun", "set_currentAmmo", [this.ptr, value]);
    }
    get FireRate() {
      return window.ctx.call("Gun", "get_FireRate", [this.ptr]).val();
    }
    get HoldToShoot() {
      return window.ctx.call("Gun", "get_HoldToShoot", [this.ptr]).val() === 1;
    }
    get ADSCenterPoint() {
      return new Transform(this.ptr.readField(232, "i32"));
    }
    set ADSCenterPoint(value) {
      return this.ptr.writeField(232, "i32", value);
    }
    get ADSRayPoint() {
      return new Transform(this.ptr.readField(228, "i32"));
    }
    set ADSRayPoint(value) {
      return this.ptr.writeField(228, "i32", value);
    }
    get OnAmmoChange() {
      return this.ptr.readField(4, "i32").val();
    }
    set OnAmmoChange(value) {
      return this.ptr.writeField(4, "i32", value);
    }
    get _currentAmmo() {
      return this.ptr.readField(272, "i32").val();
    }
    set _currentAmmo(value) {
      return this.ptr.writeField(272, "i32", value);
    }
    get activeSequenceAudioSources() {
      return this.ptr.readField(332, "i32");
    }
    set activeSequenceAudioSources(value) {
      return this.ptr.writeField(332, "i32", value);
    }
    get afterSwitchDontAllowShootFor() {
      return this.ptr.readField(316, "f32").val();
    }
    set afterSwitchDontAllowShootFor(value) {
      return this.ptr.writeField(316, "f32", value);
    }
    get aimFOVWeapon() {
      return this.ptr.readField(240, "f32").val();
    }
    set aimFOVWeapon(value) {
      return this.ptr.writeField(240, "f32", value);
    }
    get aimFOVWorld() {
      return this.ptr.readField(236, "f32").val();
    }
    set aimFOVWorld(value) {
      return this.ptr.writeField(236, "f32", value);
    }
    get allowAimAssist() {
      return this.ptr.readField(40, "i32").val() === 1;
    }
    set allowAimAssist(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get ammoTextFormat() {
      return this.ptr.readField(348, "i32").mstr();
    }
    set ammoTextFormat(value) {
      return this.ptr.writeField(348, "i32", window.ctx.createMstr(value));
    }
    get animator() {
      return new Animator(this.ptr.readField(108, "i32"));
    }
    set animator(value) {
      return this.ptr.writeField(108, "i32", value);
    }
    get backgroundColor() {
      return new Color(this.ptr.readField(64, "i32"));
    }
    set backgroundColor(value) {
      return this.ptr.writeField(64, "i32", value);
    }
    get bloom() {
      return this.ptr.readField(220, "f32").val();
    }
    set bloom(value) {
      return this.ptr.writeField(220, "f32", value);
    }
    get bulletPrefab() {
      return new Bullet(this.ptr.readField(124, "i32"));
    }
    set bulletPrefab(value) {
      return this.ptr.writeField(124, "i32", value);
    }
    get bulletRow() {
      return this.ptr.readField(304, "f32").val();
    }
    set bulletRow(value) {
      return this.ptr.writeField(304, "f32", value);
    }
    get cameraRecoilData() {
      return new RecoilData(this.ptr.readField(252, "i32"));
    }
    set cameraRecoilData(value) {
      return this.ptr.writeField(252, "i32", value);
    }
    get canAimAtAll() {
      return this.ptr.readField(96, "i32").val() === 1;
    }
    set canAimAtAll(value) {
      return this.ptr.writeField(96, "i32", value);
    }
    get crosshairStyle() {
      return this.ptr.readField(84, "i32");
    }
    set crosshairStyle(value) {
      return this.ptr.writeField(84, "i32", value);
    }
    get curVel() {
      return this.ptr.readField(292, "f32").val();
    }
    set curVel(value) {
      return this.ptr.writeField(292, "f32", value);
    }
    get current() {
      return new Gun(this.ptr.readField(0, "i32"));
    }
    set current(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get damageRandom() {
      return this.ptr.readField(216, "f32").val();
    }
    set damageRandom(value) {
      return this.ptr.writeField(216, "f32", value);
    }
    get defaultTexture() {
      return this.ptr.readField(44, "i32").mstr();
    }
    set defaultTexture(value) {
      return this.ptr.writeField(44, "i32", window.ctx.createMstr(value));
    }
    get fireRate() {
      return this.ptr.readField(188, "f32").val();
    }
    set fireRate(value) {
      return this.ptr.writeField(188, "f32", value);
    }
    get globalHoldType() {
      return this.ptr.readField(88, "i32");
    }
    set globalHoldType(value) {
      return this.ptr.writeField(88, "i32", value);
    }
    get gunGfx() {
      return new GameObject(this.ptr.readField(80, "i32"));
    }
    set gunGfx(value) {
      return this.ptr.writeField(80, "i32", value);
    }
    get handsModel() {
      return new GameObject(this.ptr.readField(128, "i32"));
    }
    set handsModel(value) {
      return this.ptr.writeField(128, "i32", value);
    }
    get headshotMulti() {
      return this.ptr.readField(224, "f32").val();
    }
    set headshotMulti(value) {
      return this.ptr.writeField(224, "f32", value);
    }
    get holdToShoot() {
      return this.ptr.readField(98, "i32").val() === 1;
    }
    set holdToShoot(value) {
      return this.ptr.writeField(98, "i32", value);
    }
    get id() {
      return this.ptr.readField(24, "i32").val();
    }
    set id(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get isGlobal() {
      return this.ptr.readField(104, "i32").val() === 1;
    }
    set isGlobal(value) {
      return this.ptr.writeField(104, "i32", value);
    }
    get isHandParent() {
      return this.ptr.readField(132, "i32").val() === 1;
    }
    set isHandParent(value) {
      return this.ptr.writeField(132, "i32", value);
    }
    get isReloading() {
      return this.ptr.readField(296, "i32").val() === 1;
    }
    set isReloading(value) {
      return this.ptr.writeField(296, "i32", value);
    }
    get lastShotTime() {
      return this.ptr.readField(276, "f32").val();
    }
    set lastShotTime(value) {
      return this.ptr.writeField(276, "f32", value);
    }
    get lastSoundPlayedWasLoad() {
      return this.ptr.readField(344, "i32").val() === 1;
    }
    set lastSoundPlayedWasLoad(value) {
      return this.ptr.writeField(344, "i32", value);
    }
    get loadClip() {
      return new AudioClip(this.ptr.readField(264, "i32"));
    }
    set loadClip(value) {
      return this.ptr.writeField(264, "i32", value);
    }
    get loadClipDelay() {
      return this.ptr.readField(268, "f32").val();
    }
    set loadClipDelay(value) {
      return this.ptr.writeField(268, "f32", value);
    }
    get loadPitch() {
      return this.ptr.readField(340, "f32").val();
    }
    set loadPitch(value) {
      return this.ptr.writeField(340, "f32", value);
    }
    get localScaleForPreview() {
      return new Vector3(this.ptr.readField(164, "i32"));
    }
    set localScaleForPreview(value) {
      return this.ptr.writeField(164, "i32", value);
    }
    get maxAmmo() {
      return this.ptr.readField(212, "i32").val();
    }
    set maxAmmo(value) {
      return this.ptr.writeField(212, "i32", value);
    }
    get maxRange() {
      return this.ptr.readField(192, "f32").val();
    }
    set maxRange(value) {
      return this.ptr.writeField(192, "f32", value);
    }
    get maxRangeDamage() {
      return this.ptr.readField(204, "f32").val();
    }
    set maxRangeDamage(value) {
      return this.ptr.writeField(204, "f32", value);
    }
    get minRange() {
      return this.ptr.readField(196, "f32").val();
    }
    set minRange(value) {
      return this.ptr.writeField(196, "f32", value);
    }
    get minRangeDamage() {
      return this.ptr.readField(200, "f32").val();
    }
    set minRangeDamage(value) {
      return this.ptr.writeField(200, "f32", value);
    }
    get missionIdToUnlock() {
      return this.ptr.readField(16, "i32").val();
    }
    set missionIdToUnlock(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get mobileHoldToShootFireRate() {
      return this.ptr.readField(100, "i32").val();
    }
    set mobileHoldToShootFireRate(value) {
      return this.ptr.writeField(100, "i32", value);
    }
    get mobileShootOnRelease() {
      return this.ptr.readField(97, "i32").val() === 1;
    }
    set mobileShootOnRelease(value) {
      return this.ptr.writeField(97, "i32", value);
    }
    get muzzleFlash() {
      return new MuzzleFlash(this.ptr.readField(116, "i32"));
    }
    set muzzleFlash(value) {
      return this.ptr.writeField(116, "i32", value);
    }
    get muzzleFlashSetParentNullTemp() {
      return this.ptr.readField(256, "i32").val() === 1;
    }
    set muzzleFlashSetParentNullTemp(value) {
      return this.ptr.writeField(256, "i32", value);
    }
    get muzzleTransform() {
      return new Transform(this.ptr.readField(120, "i32"));
    }
    set muzzleTransform(value) {
      return this.ptr.writeField(120, "i32", value);
    }
    get myGunSkin() {
      return new GunSkin(this.ptr.readField(336, "i32"));
    }
    set myGunSkin(value) {
      return this.ptr.writeField(336, "i32", value);
    }
    get myTextureLoader() {
      return new MyTextureLoader(this.ptr.readField(52, "i32"));
    }
    set myTextureLoader(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get nextFireTime() {
      return this.ptr.readField(184, "f32").val();
    }
    set nextFireTime(value) {
      return this.ptr.writeField(184, "f32", value);
    }
    get nextRightClickTime() {
      return this.ptr.readField(364, "f32").val();
    }
    set nextRightClickTime(value) {
      return this.ptr.writeField(364, "f32", value);
    }
    get parentRecoilData() {
      return new RecoilData(this.ptr.readField(248, "i32"));
    }
    set parentRecoilData(value) {
      return this.ptr.writeField(248, "i32", value);
    }
    get physicalCharacterRecoil() {
      return this.ptr.readField(60, "f32").val();
    }
    set physicalCharacterRecoil(value) {
      return this.ptr.writeField(60, "f32", value);
    }
    get pivotParent() {
      return new Transform(this.ptr.readField(136, "i32"));
    }
    set pivotParent(value) {
      return this.ptr.writeField(136, "i32", value);
    }
    get positionForPreview() {
      return new Vector3(this.ptr.readField(140, "i32"));
    }
    set positionForPreview(value) {
      return this.ptr.writeField(140, "i32", value);
    }
    get previousAiming() {
      return this.ptr.readField(289, "i32").val() === 1;
    }
    set previousAiming(value) {
      return this.ptr.writeField(289, "i32", value);
    }
    get previousSprinting() {
      return this.ptr.readField(288, "i32").val() === 1;
    }
    set previousSprinting(value) {
      return this.ptr.writeField(288, "i32", value);
    }
    get progressiveReload() {
      return this.ptr.readField(257, "i32").val() === 1;
    }
    set progressiveReload(value) {
      return this.ptr.writeField(257, "i32", value);
    }
    get rarity() {
      return new GunRarity(this.ptr.readField(36, "i32"));
    }
    set rarity(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get reloadAudioSource() {
      return new AudioSource(this.ptr.readField(324, "i32"));
    }
    set reloadAudioSource(value) {
      return this.ptr.writeField(324, "i32", value);
    }
    get reloadSounds() {
      return JSArray(this.ptr.readField(320, "i32"));
    }
    set reloadSounds(value) {
      return this.ptr.writeField(320, "i32", value);
    }
    get reloadTween() {
      return new Tween(this.ptr.readField(300, "i32"));
    }
    set reloadTween(value) {
      return this.ptr.writeField(300, "i32", value);
    }
    get renderAddressableName() {
      return this.ptr.readField(48, "i32").mstr();
    }
    set renderAddressableName(value) {
      return this.ptr.writeField(48, "i32", window.ctx.createMstr(value));
    }
    get rightClickAttackSoundName() {
      return this.ptr.readField(356, "i32").mstr();
    }
    set rightClickAttackSoundName(value) {
      return this.ptr.writeField(356, "i32", window.ctx.createMstr(value));
    }
    get rightClickFireRate() {
      return this.ptr.readField(360, "f32").val();
    }
    set rightClickFireRate(value) {
      return this.ptr.writeField(360, "f32", value);
    }
    get rightClickSprite() {
      return new Sprite(this.ptr.readField(352, "i32"));
    }
    set rightClickSprite(value) {
      return this.ptr.writeField(352, "i32", value);
    }
    get rotationForPreview() {
      return new Vector3(this.ptr.readField(152, "i32"));
    }
    set rotationForPreview(value) {
      return this.ptr.writeField(152, "i32", value);
    }
    get shootAudioPool() {
      return JSArray(this.ptr.readField(280, "i32"));
    }
    set shootAudioPool(value) {
      return this.ptr.writeField(280, "i32", value);
    }
    get shootAudioPoolIndex() {
      return this.ptr.readField(284, "i32").val();
    }
    set shootAudioPoolIndex(value) {
      return this.ptr.writeField(284, "i32", value);
    }
    get shootPitchOverFire() {
      return new AnimationCurve(this.ptr.readField(92, "i32"));
    }
    set shootPitchOverFire(value) {
      return this.ptr.writeField(92, "i32", value);
    }
    get shootSource() {
      return new AudioSource(this.ptr.readField(260, "i32"));
    }
    set shootSource(value) {
      return this.ptr.writeField(260, "i32", value);
    }
    get shooter() {
      return new ColyShooter(this.ptr.readField(244, "i32"));
    }
    set shooter(value) {
      return this.ptr.writeField(244, "i32", value);
    }
    get skinId() {
      return this.ptr.readField(56, "i32").val();
    }
    set skinId(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get slotIndex() {
      return this.ptr.readField(28, "i32").val();
    }
    set slotIndex(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get soundSequenceCoroutine() {
      return new Coroutine(this.ptr.readField(328, "i32"));
    }
    set soundSequenceCoroutine(value) {
      return this.ptr.writeField(328, "i32", value);
    }
    get sprintSpeedMulti() {
      return this.ptr.readField(208, "f32").val();
    }
    set sprintSpeedMulti(value) {
      return this.ptr.writeField(208, "f32", value);
    }
    get swayMulti() {
      return this.ptr.readField(176, "f32").val();
    }
    set swayMulti(value) {
      return this.ptr.writeField(176, "f32", value);
    }
    get swayYMovementMulti() {
      return this.ptr.readField(180, "f32").val();
    }
    set swayYMovementMulti(value) {
      return this.ptr.writeField(180, "f32", value);
    }
    get totalAmmo() {
      return this.ptr.readField(20, "i32").val();
    }
    set totalAmmo(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get type() {
      return this.ptr.readField(32, "i32").mstr();
    }
    set type(value) {
      return this.ptr.writeField(32, "i32", window.ctx.createMstr(value));
    }
    get worldCameraController() {
      return new RuntimeAnimatorController(this.ptr.readField(112, "i32"));
    }
    set worldCameraController(value) {
      return this.ptr.writeField(112, "i32", value);
    }
    _ReAllocateMyAudio_b_127_0() {
      return window.ctx.call("Gun", "<ReAllocateMyAudio>b__127_0", [this.ptr]).val() === 1;
    }
    ApplyRecoil() {
      window.ctx.call("Gun", "ApplyRecoil", [this.ptr]);
    }
    CalculateDamage(arg0, arg1) {
      return window.ctx.call("Gun", "CalculateDamage", [this.ptr, arg0, arg1]).val();
    }
    CanAim() {
      return window.ctx.call("Gun", "CanAim", [this.ptr]).val() === 1;
    }
    CanInspect() {
      return window.ctx.call("Gun", "CanInspect", [this.ptr]).val() === 1;
    }
    CanShoot(arg0, arg1) {
      return window.ctx.call("Gun", "CanShoot", [this.ptr, arg0, arg1]).val() === 1;
    }
    CanSprint() {
      return window.ctx.call("Gun", "CanSprint", [this.ptr]).val() === 1;
    }
    CanSwitch() {
      return window.ctx.call("Gun", "CanSwitch", [this.ptr]).val() === 1;
    }
    CancelInspect() {
      window.ctx.call("Gun", "CancelInspect", [this.ptr]);
    }
    CancelReload() {
      window.ctx.call("Gun", "CancelReload", [this.ptr]);
    }
    CleanupAllSequenceAudio() {
      window.ctx.call("Gun", "CleanupAllSequenceAudio", [this.ptr]);
    }
    DelayedReloadStart(arg0) {
      return window.ctx.call("Gun", "DelayedReloadStart", [this.ptr, arg0]);
    }
    EnsureLayer() {
      window.ctx.call("Gun", "EnsureLayer", [this.ptr]);
    }
    FreeMyAudio() {
      window.ctx.call("Gun", "FreeMyAudio", [this.ptr]);
    }
    GetAnimationDuration(arg0) {
      return window.ctx.call("Gun", "GetAnimationDuration", [this.ptr, arg0]).val();
    }
    GetBaseDamage() {
      return window.ctx.call("Gun", "GetBaseDamage", [this.ptr]).val();
    }
    GetFinalBgColor() {
      return window.ctx.call("Gun", "GetFinalBgColor", [this.ptr]);
    }
    GetFinalRenderAddressableName() {
      return window.ctx.call("Gun", "GetFinalRenderAddressableName", [this.ptr]);
    }
    GetFinalSkinId() {
      return window.ctx.call("Gun", "GetFinalSkinId", [this.ptr]).val();
    }
    GetMySkins() {
      return window.ctx.call("Gun", "GetMySkins", [this.ptr]);
    }
    GetMyWraps() {
      return window.ctx.call("Gun", "GetMyWraps", [this.ptr]);
    }
    GetTimeToNextRightClickAttack() {
      return window.ctx.call("Gun", "GetTimeToNextRightClickAttack", [this.ptr]).val();
    }
    HasClearedSwitchRightClickDelay() {
      return window.ctx.call("Gun", "HasClearedSwitchRightClickDelay", [this.ptr]).val() === 1;
    }
    HasClearedSwitchShootDelay() {
      return window.ctx.call("Gun", "HasClearedSwitchShootDelay", [this.ptr]).val() === 1;
    }
    Init(arg0, arg1, arg2) {
      window.ctx.call("Gun", "Init", [this.ptr, arg0, arg1, arg2]);
    }
    InitForPreview() {
      return new GameObject(window.ctx.call("Gun", "InitForPreview", [this.ptr]));
    }
    InitGlobal(arg0, arg1) {
      window.ctx.call("Gun", "InitGlobal", [this.ptr, arg0, arg1]);
    }
    InitializeShootAudioPool() {
      window.ctx.call("Gun", "InitializeShootAudioPool", [this.ptr]);
    }
    IsFullAmmo() {
      return window.ctx.call("Gun", "IsFullAmmo", [this.ptr]).val() === 1;
    }
    IsRaycastShooting() {
      return window.ctx.call("Gun", "IsRaycastShooting", [this.ptr]).val() === 1;
    }
    IsUnlocked() {
      return window.ctx.call("Gun", "IsUnlocked", [this.ptr]);
    }
    LoadAllMySounds() {
      window.ctx.call("Gun", "LoadAllMySounds", [this.ptr]);
    }
    LoadMySkinIfNeeded() {
      return window.ctx.call("Gun", "LoadMySkinIfNeeded", [this.ptr]);
    }
    LoadMyTexture() {
      window.ctx.call("Gun", "LoadMyTexture", [this.ptr]);
    }
    OnAim(arg0) {
      window.ctx.call("Gun", "OnAim", [this.ptr, arg0]);
    }
    OnCancelInspect() {
      window.ctx.call("Gun", "OnCancelInspect", [this.ptr]);
    }
    OnDrawGizmos() {
      window.ctx.call("Gun", "OnDrawGizmos", [this.ptr]);
    }
    OnGunSwitchTick(arg0) {
      window.ctx.call("Gun", "OnGunSwitchTick", [this.ptr, arg0]);
    }
    OnInspect() {
      window.ctx.call("Gun", "OnInspect", [this.ptr]);
    }
    OnLocalUpdate() {
      window.ctx.call("Gun", "OnLocalUpdate", [this.ptr]);
    }
    OnSprint(arg0) {
      window.ctx.call("Gun", "OnSprint", [this.ptr, arg0]);
    }
    PlayLoadSound() {
      window.ctx.call("Gun", "PlayLoadSound", [this.ptr]);
    }
    PlayLoadSoundDelayed() {
      return window.ctx.call("Gun", "PlayLoadSoundDelayed", [this.ptr]);
    }
    PlayLoadSoundWithPitch() {
      window.ctx.call("Gun", "PlayLoadSoundWithPitch", [this.ptr]);
    }
    PlayRightClickAttackSound() {
      window.ctx.call("Gun", "PlayRightClickAttackSound", [this.ptr]);
    }
    PlayShotAudio() {
      window.ctx.call("Gun", "PlayShotAudio", [this.ptr]);
    }
    PlaySoundSequence(arg0) {
      return window.ctx.call("Gun", "PlaySoundSequence", [this.ptr, arg0]);
    }
    ReAllocateMyAudio() {
      window.ctx.call("Gun", "ReAllocateMyAudio", [this.ptr]);
    }
    RefillAmmoImmediate() {
      window.ctx.call("Gun", "RefillAmmoImmediate", [this.ptr]);
    }
    SendSpecialAttackMessage(arg0) {
      window.ctx.call("Gun", "SendSpecialAttackMessage", [this.ptr, arg0]);
    }
    SetAnimationFloat(arg0, arg1) {
      window.ctx.call("Gun", "SetAnimationFloat", [this.ptr, arg0, arg1]);
    }
    SetAnimationTrigger(arg0) {
      window.ctx.call("Gun", "SetAnimationTrigger", [this.ptr, arg0]);
    }
    Shoot(arg0, arg1, arg2, arg3) {
      window.ctx.call("Gun", "Shoot", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    StopAndCleanupSoundSequence() {
      window.ctx.call("Gun", "StopAndCleanupSoundSequence", [this.ptr]);
    }
    TryCalculateDamageOverride(arg0, arg1, arg2) {
      return window.ctx.call("Gun", "TryCalculateDamageOverride", [this.ptr, arg0, arg1, arg2]).val() === 1;
    }
    static TryGetCurrent(arg0) {
      return window.ctx.call("Gun", "TryGetCurrent", [arg0]).val() === 1;
    }
    TryInspect() {
      window.ctx.call("Gun", "TryInspect", [this.ptr]);
    }
    TryReload() {
      window.ctx.call("Gun", "TryReload", [this.ptr]);
    }
    Update() {
      window.ctx.call("Gun", "Update", [this.ptr]);
    }
  }
  class ColyBehaviour {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get IsMine() {
      return window.ctx.call("ColyBehaviour", "get_IsMine", [this.ptr]).val() === 1;
    }
    get playerState() {
      return new PlayerState(window.ctx.call("ColyBehaviour", "get_playerState", [this.ptr]));
    }
    get colyView() {
      return new ColyView(this.ptr.readField(16, "i32"));
    }
    set colyView(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    InternalOnNetworkSpawned(arg0) {
      window.ctx.call("ColyBehaviour", "InternalOnNetworkSpawned", [this.ptr, arg0]);
    }
    OnNetworkSpawned(arg0) {
      window.ctx.call("ColyBehaviour", "OnNetworkSpawned", [this.ptr, arg0]);
    }
    TryGetColyBehaviour(arg0) {
      return window.ctx.call("ColyBehaviour", "TryGetColyBehaviour", [this.ptr, arg0]).val() === 1;
    }
  }
  class WorldGrenade {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get alive() {
      return this.ptr.readField(16, "i32").val() === 1;
    }
    set alive(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get explosionPrefab() {
      return new GameObject(this.ptr.readField(52, "i32"));
    }
    set explosionPrefab(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get explosionShakeEffect() {
      return new ShakePreset(this.ptr.readField(20, "i32"));
    }
    set explosionShakeEffect(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get grenadeData() {
      return new GrenadeData(this.ptr.readField(40, "i32"));
    }
    set grenadeData(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get hitColliders() {
      return JSArray(this.ptr.readField(100, "i32"));
    }
    set hitColliders(value) {
      return this.ptr.writeField(100, "i32", value);
    }
    get isMine() {
      return this.ptr.readField(80, "i32").val() === 1;
    }
    set isMine(value) {
      return this.ptr.writeField(80, "i32", value);
    }
    get lastSentTime() {
      return this.ptr.readField(84, "f32").val();
    }
    set lastSentTime(value) {
      return this.ptr.writeField(84, "f32", value);
    }
    get localExplosionColliders() {
      return JSArray(this.ptr.readField(88, "i32"));
    }
    set localExplosionColliders(value) {
      return this.ptr.writeField(88, "i32", value);
    }
    get mapLayerMask() {
      return new LayerMask(this.ptr.readField(96, "i32"));
    }
    set mapLayerMask(value) {
      return this.ptr.writeField(96, "i32", value);
    }
    get myCollider() {
      return new Collider(this.ptr.readField(36, "i32"));
    }
    set myCollider(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get networkTransformData() {
      return new Vector3(this.ptr.readField(56, "i32"));
    }
    set networkTransformData(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get playerLayerMask() {
      return new LayerMask(this.ptr.readField(92, "i32"));
    }
    set playerLayerMask(value) {
      return this.ptr.writeField(92, "i32", value);
    }
    get rb() {
      return new Rigidbody(this.ptr.readField(32, "i32"));
    }
    set rb(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get strengthOverDistanceForMe() {
      return new AnimationCurve(this.ptr.readField(24, "i32"));
    }
    set strengthOverDistanceForMe(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get strengthOverDistanceForOthers() {
      return new AnimationCurve(this.ptr.readField(28, "i32"));
    }
    set strengthOverDistanceForOthers(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get unregisterPositionChange() {
      return this.ptr.readField(44, "i32");
    }
    set unregisterPositionChange(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get unregisterRotationChange() {
      return this.ptr.readField(48, "i32");
    }
    set unregisterRotationChange(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    Die() {
      window.ctx.call("WorldGrenade", "Die", [this.ptr]);
    }
    Init(arg0, arg1) {
      window.ctx.call("WorldGrenade", "Init", [this.ptr, arg0, arg1]);
    }
    OfflineExplode() {
      window.ctx.call("WorldGrenade", "OfflineExplode", [this.ptr]);
    }
    OnDestroy() {
      window.ctx.call("WorldGrenade", "OnDestroy", [this.ptr]);
    }
    OnExplode(arg0, arg1) {
      window.ctx.call("WorldGrenade", "OnExplode", [this.ptr, arg0, arg1]);
    }
    OnPositionOrRotationChangedTick(arg0, arg1) {
      window.ctx.call("WorldGrenade", "OnPositionOrRotationChangedTick", [this.ptr, arg0, arg1]);
    }
    SendGrenadePositionUpdate() {
      window.ctx.call("WorldGrenade", "SendGrenadePositionUpdate", [this.ptr]);
    }
    ShouldApplyDamage() {
      return window.ctx.call("WorldGrenade", "ShouldApplyDamage", [this.ptr]).val() === 1;
    }
    ShouldApplyShake() {
      return window.ctx.call("WorldGrenade", "ShouldApplyShake", [this.ptr]).val() === 1;
    }
    ShouldSendUpdate() {
      return window.ctx.call("WorldGrenade", "ShouldSendUpdate", [this.ptr]).val() === 1;
    }
    Update() {
      window.ctx.call("WorldGrenade", "Update", [this.ptr]);
    }
  }
  class ColyShooter {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get currentGun() {
      return new Gun(window.ctx.call("ColyShooter", "get_currentGun", [this.ptr]));
    }
    get OnGunChange() {
      return this.ptr.readField(64, "i32");
    }
    set OnGunChange(value) {
      return this.ptr.writeField(64, "i32", value);
    }
    get OnInventoryChange() {
      return this.ptr.readField(68, "i32");
    }
    set OnInventoryChange(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get allyIndicator() {
      return new GameObject(this.ptr.readField(28, "i32"));
    }
    set allyIndicator(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get colyTeamMember() {
      return new ColyTeamMember(this.ptr.readField(92, "i32"));
    }
    set colyTeamMember(value) {
      return this.ptr.writeField(92, "i32", value);
    }
    get currentGunLocalIndex() {
      return this.ptr.readField(72, "i32").val();
    }
    set currentGunLocalIndex(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get currentTrashCan() {
      return new TrashCan(this.ptr.readField(104, "i32"));
    }
    set currentTrashCan(value) {
      return this.ptr.writeField(104, "i32", value);
    }
    get globalAnimator() {
      return new Animator(this.ptr.readField(24, "i32"));
    }
    set globalAnimator(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get globalGunParent() {
      return new Transform(this.ptr.readField(48, "i32"));
    }
    set globalGunParent(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    get gunPickupImageFx() {
      return new UIImage(this.ptr.readField(56, "i32"));
    }
    set gunPickupImageFx(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get hitLayers() {
      return new LayerMask(this.ptr.readField(52, "i32"));
    }
    set hitLayers(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get lasGunChangeTime() {
      return this.ptr.readField(20, "f32").val();
    }
    set lasGunChangeTime(value) {
      return this.ptr.writeField(20, "f32", value);
    }
    get lastHitName() {
      return this.ptr.readField(0, "i32");
    }
    set lastHitName(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get localGunParent() {
      return new Transform(this.ptr.readField(44, "i32"));
    }
    set localGunParent(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get movementStateManager() {
      return new MovementStateManager(this.ptr.readField(32, "i32"));
    }
    set movementStateManager(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get myInventory() {
      return this.ptr.readField(60, "i32");
    }
    set myInventory(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get rifleBurstRunning() {
      return this.ptr.readField(96, "i32").val() === 1;
    }
    set rifleBurstRunning(value) {
      return this.ptr.writeField(96, "i32", value);
    }
    get spawnTime() {
      return this.ptr.readField(100, "f32").val();
    }
    set spawnTime(value) {
      return this.ptr.writeField(100, "f32", value);
    }
    get unregisterGunSwitch() {
      return this.ptr.readField(76, "i32");
    }
    set unregisterGunSwitch(value) {
      return this.ptr.writeField(76, "i32", value);
    }
    get unregisterInventoryAdds() {
      return this.ptr.readField(80, "i32");
    }
    set unregisterInventoryAdds(value) {
      return this.ptr.writeField(80, "i32", value);
    }
    get unregisterInventoryChange() {
      return this.ptr.readField(84, "i32");
    }
    set unregisterInventoryChange(value) {
      return this.ptr.writeField(84, "i32", value);
    }
    get unregisterInventoryRemovals() {
      return this.ptr.readField(88, "i32");
    }
    set unregisterInventoryRemovals(value) {
      return this.ptr.writeField(88, "i32", value);
    }
    get worldCamera() {
      return new Camera(this.ptr.readField(40, "i32"));
    }
    set worldCamera(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get worldCameraSpring() {
      return new Spring(this.ptr.readField(36, "i32"));
    }
    set worldCameraSpring(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    _AddItemToInventory_b_34_0(arg0) {
      window.ctx.call("ColyShooter", "<AddItemToInventory>b__34_0", [this.ptr, arg0]);
    }
    _AddItemToInventory_b_34_1(arg0) {
      window.ctx.call("ColyShooter", "<AddItemToInventory>b__34_1", [this.ptr, arg0]);
    }
    _AddItemToInventory_b_34_2() {
      window.ctx.call("ColyShooter", "<AddItemToInventory>b__34_2", [this.ptr]);
    }
    _AddItemToInventory_b_34_3() {
      window.ctx.call("ColyShooter", "<AddItemToInventory>b__34_3", [this.ptr]);
    }
    _OnNetworkSpawned_b_29_1(arg0, arg1) {
      window.ctx.call("ColyShooter", "<OnNetworkSpawned>b__29_1", [this.ptr, arg0, arg1]);
    }
    _OnNetworkSpawned_b_29_10(arg0, arg1) {
      window.ctx.call("ColyShooter", "<OnNetworkSpawned>b__29_10", [this.ptr, arg0, arg1]);
    }
    _OnNetworkSpawned_b_29_4(arg0, arg1) {
      window.ctx.call("ColyShooter", "<OnNetworkSpawned>b__29_4", [this.ptr, arg0, arg1]);
    }
    _OnNetworkSpawned_b_29_5(arg0) {
      window.ctx.call("ColyShooter", "<OnNetworkSpawned>b__29_5", [this.ptr, arg0]);
    }
    _OnNetworkSpawned_b_29_6(arg0) {
      window.ctx.call("ColyShooter", "<OnNetworkSpawned>b__29_6", [this.ptr, arg0]);
    }
    _OnNetworkSpawned_b_29_8(arg0, arg1) {
      window.ctx.call("ColyShooter", "<OnNetworkSpawned>b__29_8", [this.ptr, arg0, arg1]);
    }
    _OnNetworkSpawned_g_RebindInventoryCollectionListeners_29_2() {
      window.ctx.call("ColyShooter", "<OnNetworkSpawned>g__RebindInventoryCollectionListeners|29_2", [this.ptr]);
    }
    AddItemToInventory(arg0, arg1) {
      window.ctx.call("ColyShooter", "AddItemToInventory", [this.ptr, arg0, arg1]);
    }
    CanPickWeapon(arg0) {
      return window.ctx.call("ColyShooter", "CanPickWeapon", [this.ptr, arg0]).val() === 1;
    }
    ChangeGun(arg0) {
      window.ctx.call("ColyShooter", "ChangeGun", [this.ptr, arg0]);
    }
    CleanupGunsOnGlobalPlayer() {
      window.ctx.call("ColyShooter", "CleanupGunsOnGlobalPlayer", [this.ptr]);
    }
    CommitSuicide() {
      window.ctx.call("ColyShooter", "CommitSuicide", [this.ptr]);
    }
    HandleShotRejectedByServer(arg0) {
      window.ctx.call("ColyShooter", "HandleShotRejectedByServer", [this.ptr, arg0]);
    }
    InitInventory(arg0, arg1) {
      window.ctx.call("ColyShooter", "InitInventory", [this.ptr, arg0, arg1]);
    }
    IntervalHitIdentification() {
      window.ctx.call("ColyShooter", "IntervalHitIdentification", [this.ptr]);
    }
    IsAbleToShoot(arg0, arg1) {
      return window.ctx.call("ColyShooter", "IsAbleToShoot", [this.ptr, arg0, arg1]).val() === 1;
    }
    OnDisable() {
      window.ctx.call("ColyShooter", "OnDisable", [this.ptr]);
    }
    OnNetworkSpawned(arg0) {
      window.ctx.call("ColyShooter", "OnNetworkSpawned", [this.ptr, arg0]);
    }
    PerformSingleShot(arg0, arg1) {
      window.ctx.call("ColyShooter", "PerformSingleShot", [this.ptr, arg0, arg1]);
    }
    RegularShoot(arg0, arg1) {
      window.ctx.call("ColyShooter", "RegularShoot", [this.ptr, arg0, arg1]);
    }
    ReloadAllGunsImmediate() {
      window.ctx.call("ColyShooter", "ReloadAllGunsImmediate", [this.ptr]);
    }
    RifleBurstRoutine(arg0, arg1) {
      return window.ctx.call("ColyShooter", "RifleBurstRoutine", [this.ptr, arg0, arg1]);
    }
    SendRPCShoot(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("ColyShooter", "SendRPCShoot", [this.ptr, arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    SetCurrentGunLocalIndex(arg0) {
      window.ctx.call("ColyShooter", "SetCurrentGunLocalIndex", [this.ptr, arg0]);
    }
    ShotgunShoot(arg0, arg1, arg2) {
      window.ctx.call("ColyShooter", "ShotgunShoot", [this.ptr, arg0, arg1, arg2]);
    }
    ShowCurrentGunOnGlobalPlayer() {
      window.ctx.call("ColyShooter", "ShowCurrentGunOnGlobalPlayer", [this.ptr]);
    }
    TryIdentifyAlly(arg0) {
      return window.ctx.call("ColyShooter", "TryIdentifyAlly", [this.ptr, arg0]).val() === 1;
    }
    TryIdentifyTargetFromHit(arg0, arg1, arg2, arg3) {
      return window.ctx.call("ColyShooter", "TryIdentifyTargetFromHit", [this.ptr, arg0, arg1, arg2, arg3]).val() === 1;
    }
    TryShoot() {
      window.ctx.call("ColyShooter", "TryShoot", [this.ptr]);
    }
    Update() {
      window.ctx.call("ColyShooter", "Update", [this.ptr]);
    }
  }
  class MovementController {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get CurrentMaxStableMoveSpeed() {
      return window.ctx
        .call("KinematicCharacterController.Examples.MovementController", "get_CurrentMaxStableMoveSpeed", [this.ptr])
        .val();
    }
    static get FreezeMovement() {
      return (
        window.ctx.call("KinematicCharacterController.Examples.MovementController", "get_FreezeMovement", []).val() ===
        1
      );
    }
    get IsAI() {
      return (
        window.ctx.call("KinematicCharacterController.Examples.MovementController", "get_IsAI", [this.ptr]).val() === 1
      );
    }
    get AirAccelerationSpeed() {
      return this.ptr.readField(100, "f32").val();
    }
    set AirAccelerationSpeed(value) {
      return this.ptr.writeField(100, "f32", value);
    }
    get AirSlideGravity() {
      return this.ptr.readField(132, "f32").val();
    }
    set AirSlideGravity(value) {
      return this.ptr.writeField(132, "f32", value);
    }
    get AllowJumpingWhenSliding() {
      return this.ptr.readField(188, "i32").val() === 1;
    }
    set AllowJumpingWhenSliding(value) {
      return this.ptr.writeField(188, "i32", value);
    }
    get BackwardsSlideDotThreshold() {
      return this.ptr.readField(152, "f32").val();
    }
    set BackwardsSlideDotThreshold(value) {
      return this.ptr.writeField(152, "f32", value);
    }
    get BackwardsSlideSpeedMultiplier() {
      return this.ptr.readField(148, "f32").val();
    }
    set BackwardsSlideSpeedMultiplier(value) {
      return this.ptr.writeField(148, "f32", value);
    }
    get CharacterGroundingReportEvent() {
      return this.ptr.readField(0, "i32").val() === 1;
    }
    set CharacterGroundingReportEvent(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get CrouchedCapsuleHeight() {
      return this.ptr.readField(224, "f32").val();
    }
    set CrouchedCapsuleHeight(value) {
      return this.ptr.writeField(224, "f32", value);
    }
    get DashEndMomentumMultiplier() {
      return this.ptr.readField(364, "f32").val();
    }
    set DashEndMomentumMultiplier(value) {
      return this.ptr.writeField(364, "f32", value);
    }
    get DisableStepHandlingAfterJumpTime() {
      return this.ptr.readField(108, "f32").val();
    }
    set DisableStepHandlingAfterJumpTime(value) {
      return this.ptr.writeField(108, "f32", value);
    }
    get Drag() {
      return this.ptr.readField(104, "f32").val();
    }
    set Drag(value) {
      return this.ptr.writeField(104, "f32", value);
    }
    get Gravity() {
      return new Vector3(this.ptr.readField(208, "i32"));
    }
    set Gravity(value) {
      return this.ptr.writeField(208, "i32", value);
    }
    get JumpPostGroundingGraceTime() {
      return this.ptr.readField(204, "f32").val();
    }
    set JumpPostGroundingGraceTime(value) {
      return this.ptr.writeField(204, "f32", value);
    }
    get JumpPreGroundingGraceTime() {
      return this.ptr.readField(200, "f32").val();
    }
    set JumpPreGroundingGraceTime(value) {
      return this.ptr.writeField(200, "f32", value);
    }
    get JumpScalableForwardSpeed() {
      return this.ptr.readField(196, "f32").val();
    }
    set JumpScalableForwardSpeed(value) {
      return this.ptr.writeField(196, "f32", value);
    }
    get JumpUpSpeed() {
      return this.ptr.readField(192, "f32").val();
    }
    set JumpUpSpeed(value) {
      return this.ptr.writeField(192, "f32", value);
    }
    get LocalHasSpeedBoost() {
      return this.ptr.readField(4, "i32").val() === 1;
    }
    set LocalHasSpeedBoost(value) {
      return this.ptr.writeField(4, "i32", value);
    }
    get MaxStableMoveSpeed() {
      return this.ptr.readField(92, "f32").val();
    }
    set MaxStableMoveSpeed(value) {
      return this.ptr.writeField(92, "f32", value);
    }
    get MeshRoot() {
      return new Transform(this.ptr.readField(220, "i32"));
    }
    set MeshRoot(value) {
      return this.ptr.writeField(220, "i32", value);
    }
    get Motor() {
      return new KinematicCharacterMotor(this.ptr.readField(84, "i32"));
    }
    set Motor(value) {
      return this.ptr.writeField(84, "i32", value);
    }
    get SlideCooldown() {
      return this.ptr.readField(136, "f32").val();
    }
    set SlideCooldown(value) {
      return this.ptr.writeField(136, "f32", value);
    }
    get SlideDownhillCarryDuration() {
      return this.ptr.readField(176, "f32").val();
    }
    set SlideDownhillCarryDuration(value) {
      return this.ptr.writeField(176, "f32", value);
    }
    get SlideDownhillCarryFlatThreshold() {
      return this.ptr.readField(180, "f32").val();
    }
    set SlideDownhillCarryFlatThreshold(value) {
      return this.ptr.writeField(180, "f32", value);
    }
    get SlideDownhillSpeedMultiplier() {
      return this.ptr.readField(172, "f32").val();
    }
    set SlideDownhillSpeedMultiplier(value) {
      return this.ptr.writeField(172, "f32", value);
    }
    get SlideDuration() {
      return this.ptr.readField(124, "f32").val();
    }
    set SlideDuration(value) {
      return this.ptr.writeField(124, "f32", value);
    }
    get SlideInputBuffer() {
      return this.ptr.readField(140, "f32").val();
    }
    set SlideInputBuffer(value) {
      return this.ptr.writeField(140, "f32", value);
    }
    get SlideJumpDownhillScalar() {
      return this.ptr.readField(168, "f32").val();
    }
    set SlideJumpDownhillScalar(value) {
      return this.ptr.writeField(168, "f32", value);
    }
    get SlideJumpUpBoost() {
      return this.ptr.readField(156, "f32").val();
    }
    set SlideJumpUpBoost(value) {
      return this.ptr.writeField(156, "f32", value);
    }
    get SlideJumpUpSpeedFactor() {
      return this.ptr.readField(160, "f32").val();
    }
    set SlideJumpUpSpeedFactor(value) {
      return this.ptr.writeField(160, "f32", value);
    }
    get SlideJumpUphillScalar() {
      return this.ptr.readField(164, "f32").val();
    }
    set SlideJumpUphillScalar(value) {
      return this.ptr.writeField(164, "f32", value);
    }
    get SlideMaxSlopeAngle() {
      return this.ptr.readField(184, "f32").val();
    }
    set SlideMaxSlopeAngle(value) {
      return this.ptr.writeField(184, "f32", value);
    }
    get SlideMaxSpeed() {
      return this.ptr.readField(116, "f32").val();
    }
    set SlideMaxSpeed(value) {
      return this.ptr.writeField(116, "f32", value);
    }
    get SlideMinSpeed() {
      return this.ptr.readField(112, "f32").val();
    }
    set SlideMinSpeed(value) {
      return this.ptr.writeField(112, "f32", value);
    }
    get SlideSpeedCurve() {
      return new AnimationCurve(this.ptr.readField(128, "i32"));
    }
    set SlideSpeedCurve(value) {
      return this.ptr.writeField(128, "i32", value);
    }
    get SlideStartBoost() {
      return this.ptr.readField(144, "f32").val();
    }
    set SlideStartBoost(value) {
      return this.ptr.writeField(144, "f32", value);
    }
    get SlideStopSpeed() {
      return this.ptr.readField(120, "f32").val();
    }
    set SlideStopSpeed(value) {
      return this.ptr.writeField(120, "f32", value);
    }
    get _backwardsSlideMultiplierActive() {
      return this.ptr.readField(492, "f32").val();
    }
    set _backwardsSlideMultiplierActive(value) {
      return this.ptr.writeField(492, "f32", value);
    }
    get _dashEndTime() {
      return this.ptr.readField(372, "f32").val();
    }
    set _dashEndTime(value) {
      return this.ptr.writeField(372, "f32", value);
    }
    get _dashVelocity() {
      return new Vector3(this.ptr.readField(376, "i32"));
    }
    set _dashVelocity(value) {
      return this.ptr.writeField(376, "i32", value);
    }
    get _downhillCarryRemaining() {
      return this.ptr.readField(484, "f32").val();
    }
    set _downhillCarryRemaining(value) {
      return this.ptr.writeField(484, "f32", value);
    }
    get _downhillCarryStrength() {
      return this.ptr.readField(488, "f32").val();
    }
    set _downhillCarryStrength(value) {
      return this.ptr.writeField(488, "f32", value);
    }
    get _initialDownhillFactor() {
      return this.ptr.readField(480, "f32").val();
    }
    set _initialDownhillFactor(value) {
      return this.ptr.writeField(480, "f32", value);
    }
    get _internalVelocityAdd() {
      return new Vector3(this.ptr.readField(400, "i32"));
    }
    set _internalVelocityAdd(value) {
      return this.ptr.writeField(400, "i32", value);
    }
    get _isCrouching() {
      return this.ptr.readField(413, "i32").val() === 1;
    }
    set _isCrouching(value) {
      return this.ptr.writeField(413, "i32", value);
    }
    get _isDashing() {
      return this.ptr.readField(368, "i32").val() === 1;
    }
    set _isDashing(value) {
      return this.ptr.writeField(368, "i32", value);
    }
    get _isSliding() {
      return this.ptr.readField(448, "i32").val() === 1;
    }
    set _isSliding(value) {
      return this.ptr.writeField(448, "i32", value);
    }
    get _jumpConsumed() {
      return this.ptr.readField(388, "i32").val() === 1;
    }
    set _jumpConsumed(value) {
      return this.ptr.writeField(388, "i32", value);
    }
    get _jumpRequested() {
      return this.ptr.readField(336, "i32").val() === 1;
    }
    set _jumpRequested(value) {
      return this.ptr.writeField(336, "i32", value);
    }
    get _jumpedThisFrame() {
      return this.ptr.readField(389, "i32").val() === 1;
    }
    set _jumpedThisFrame(value) {
      return this.ptr.writeField(389, "i32", value);
    }
    get _lastSlideEndTime() {
      return this.ptr.readField(452, "f32").val();
    }
    set _lastSlideEndTime(value) {
      return this.ptr.writeField(452, "f32", value);
    }
    get _lastSlidePressedTime() {
      return this.ptr.readField(456, "f32").val();
    }
    set _lastSlidePressedTime(value) {
      return this.ptr.writeField(456, "f32", value);
    }
    get _maxHorizontalSpeedInAir() {
      return this.ptr.readField(420, "f32").val();
    }
    set _maxHorizontalSpeedInAir(value) {
      return this.ptr.writeField(420, "f32", value);
    }
    get _moveInputVector() {
      return new Vector3(this.ptr.readField(324, "i32"));
    }
    set _moveInputVector(value) {
      return this.ptr.writeField(324, "i32", value);
    }
    get _overrideYRot() {
      return this.ptr.readField(516, "f32").val();
    }
    set _overrideYRot(value) {
      return this.ptr.writeField(516, "f32", value);
    }
    get _probedColliders() {
      return JSArray(this.ptr.readField(316, "i32"));
    }
    set _probedColliders(value) {
      return this.ptr.writeField(316, "i32", value);
    }
    get _probedHits() {
      return JSArray(this.ptr.readField(320, "i32"));
    }
    set _probedHits(value) {
      return this.ptr.writeField(320, "i32", value);
    }
    get _rawMoveInputLocal() {
      return new Vector3(this.ptr.readField(304, "i32"));
    }
    set _rawMoveInputLocal(value) {
      return this.ptr.writeField(304, "i32", value);
    }
    get _shouldBeCrouching() {
      return this.ptr.readField(412, "i32").val() === 1;
    }
    set _shouldBeCrouching(value) {
      return this.ptr.writeField(412, "i32", value);
    }
    get _slideDirection() {
      return new Vector3(this.ptr.readField(460, "i32"));
    }
    set _slideDirection(value) {
      return this.ptr.writeField(460, "i32", value);
    }
    get _slideElapsed() {
      return this.ptr.readField(476, "f32").val();
    }
    set _slideElapsed(value) {
      return this.ptr.writeField(476, "f32", value);
    }
    get _slideStartSpeed() {
      return this.ptr.readField(472, "f32").val();
    }
    set _slideStartSpeed(value) {
      return this.ptr.writeField(472, "f32", value);
    }
    get _timeSinceJumpRequested() {
      return this.ptr.readField(392, "f32").val();
    }
    set _timeSinceJumpRequested(value) {
      return this.ptr.writeField(392, "f32", value);
    }
    get _timeSinceLastAbleToJump() {
      return this.ptr.readField(396, "f32").val();
    }
    set _timeSinceLastAbleToJump(value) {
      return this.ptr.writeField(396, "f32", value);
    }
    get _timeSinceLastJump() {
      return this.ptr.readField(416, "f32").val();
    }
    set _timeSinceLastJump(value) {
      return this.ptr.writeField(416, "f32", value);
    }
    get _tmpTransientRot() {
      return new Quaternion(this.ptr.readField(496, "i32"));
    }
    set _tmpTransientRot(value) {
      return this.ptr.writeField(496, "i32", value);
    }
    get characterCamera() {
      return new CharacterCamera(this.ptr.readField(16, "i32"));
    }
    set characterCamera(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get colyTeamMember() {
      return new ColyTeamMember(this.ptr.readField(20, "i32"));
    }
    set colyTeamMember(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get colyView() {
      return new ColyView(this.ptr.readField(24, "i32"));
    }
    set colyView(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get currentCustomKnockback() {
      return new Vector3(this.ptr.readField(352, "i32"));
    }
    set currentCustomKnockback(value) {
      return this.ptr.writeField(352, "i32", value);
    }
    get currentLadder() {
      return new BoxCollider(this.ptr.readField(256, "i32"));
    }
    set currentLadder(value) {
      return this.ptr.writeField(256, "i32", value);
    }
    get currentLadderTransform() {
      return new Transform(this.ptr.readField(260, "i32"));
    }
    set currentLadderTransform(value) {
      return this.ptr.writeField(260, "i32", value);
    }
    get currentYRot() {
      return this.ptr.readField(512, "f32").val();
    }
    set currentYRot(value) {
      return this.ptr.writeField(512, "f32", value);
    }
    get initialMaxStableMoveSpeed() {
      return this.ptr.readField(88, "f32").val();
    }
    set initialMaxStableMoveSpeed(value) {
      return this.ptr.writeField(88, "f32", value);
    }
    get isOnLadder() {
      return this.ptr.readField(252, "i32").val() === 1;
    }
    set isOnLadder(value) {
      return this.ptr.writeField(252, "i32", value);
    }
    get jumpPadOverrideForce() {
      return new Vector3(this.ptr.readField(340, "i32"));
    }
    set jumpPadOverrideForce(value) {
      return this.ptr.writeField(340, "i32", value);
    }
    get ladderAttachUngroundTime() {
      return this.ptr.readField(244, "f32").val();
    }
    set ladderAttachUngroundTime(value) {
      return this.ptr.writeField(244, "f32", value);
    }
    get ladderBottomWorld() {
      return new Vector3(this.ptr.readField(292, "i32"));
    }
    set ladderBottomWorld(value) {
      return this.ptr.writeField(292, "i32", value);
    }
    get ladderCandidate() {
      return new BoxCollider(this.ptr.readField(264, "i32"));
    }
    set ladderCandidate(value) {
      return this.ptr.writeField(264, "i32", value);
    }
    get ladderClimbSpeed() {
      return this.ptr.readField(228, "f32").val();
    }
    set ladderClimbSpeed(value) {
      return this.ptr.writeField(228, "f32", value);
    }
    get ladderDetachInputThreshold() {
      return this.ptr.readField(236, "f32").val();
    }
    set ladderDetachInputThreshold(value) {
      return this.ptr.writeField(236, "f32", value);
    }
    get ladderEndEpsilon() {
      return this.ptr.readField(248, "f32").val();
    }
    set ladderEndEpsilon(value) {
      return this.ptr.writeField(248, "f32", value);
    }
    get ladderPopOffSpeed() {
      return this.ptr.readField(240, "f32").val();
    }
    set ladderPopOffSpeed(value) {
      return this.ptr.writeField(240, "f32", value);
    }
    get ladderStrafeSpeed() {
      return this.ptr.readField(232, "f32").val();
    }
    set ladderStrafeSpeed(value) {
      return this.ptr.writeField(232, "f32", value);
    }
    get ladderTopWorld() {
      return new Vector3(this.ptr.readField(280, "i32"));
    }
    set ladderTopWorld(value) {
      return this.ptr.writeField(280, "i32", value);
    }
    get ladderUp() {
      return new Vector3(this.ptr.readField(268, "i32"));
    }
    set ladderUp(value) {
      return this.ptr.writeField(268, "i32", value);
    }
    get lastCharacterGroundingReport() {
      return new CharacterGroundingReport(this.ptr.readField(28, "i32"));
    }
    set lastCharacterGroundingReport(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get lastInnerNormal() {
      return new Vector3(this.ptr.readField(424, "i32"));
    }
    set lastInnerNormal(value) {
      return this.ptr.writeField(424, "i32", value);
    }
    get lastOuterNormal() {
      return new Vector3(this.ptr.readField(436, "i32"));
    }
    set lastOuterNormal(value) {
      return this.ptr.writeField(436, "i32", value);
    }
    get speedBoostMultis() {
      return this.ptr.readField(96, "f32").val();
    }
    set speedBoostMultis(value) {
      return this.ptr.writeField(96, "f32", value);
    }
    AddVelocity(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "AddVelocity", [this.ptr, arg0]);
    }
    AfterCharacterUpdate(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "AfterCharacterUpdate", [
        this.ptr,
        arg0,
      ]);
    }
    ApplyKnockbackForce(arg0, arg1) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "ApplyKnockbackForce", [
        this.ptr,
        arg0,
        arg1,
      ]);
    }
    ApplyTermporalBoost(arg0, arg1) {
      return window.ctx
        .call("KinematicCharacterController.Examples.MovementController", "ApplyTermporalBoost", [this.ptr, arg0, arg1])
        .val();
    }
    Awake() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "Awake", [this.ptr]);
    }
    BeforeCharacterUpdate(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "BeforeCharacterUpdate", [
        this.ptr,
        arg0,
      ]);
    }
    Dash(arg0, arg1, arg2) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "Dash", [this.ptr, arg0, arg1, arg2]);
    }
    EndSlide(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "EndSlide", [this.ptr, arg0]);
    }
    EnterLadder(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "EnterLadder", [this.ptr, arg0]);
    }
    ExitLadder() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "ExitLadder", [this.ptr]);
    }
    GetCharacterBottomWorld() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.Examples.MovementController", "GetCharacterBottomWorld", [
          out,
          this.ptr,
        ]);
        return out;
      })();
    }
    GetCharacterTopWorld() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.Examples.MovementController", "GetCharacterTopWorld", [
          out,
          this.ptr,
        ]);
        return out;
      })();
    }
    GetCurrentCameraMode() {
      return window.ctx.call("KinematicCharacterController.Examples.MovementController", "GetCurrentCameraMode", [
        this.ptr,
      ]);
    }
    GetIsAI() {
      return (
        window.ctx.call("KinematicCharacterController.Examples.MovementController", "GetIsAI", [this.ptr]).val() === 1
      );
    }
    GetLadderOut() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.Examples.MovementController", "GetLadderOut", [out, this.ptr]);
        return out;
      })();
    }
    GetLadderRight() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.Examples.MovementController", "GetLadderRight", [out, this.ptr]);
        return out;
      })();
    }
    GetSpeedBoostMultiplier() {
      return window.ctx
        .call("KinematicCharacterController.Examples.MovementController", "GetSpeedBoostMultiplier", [this.ptr])
        .val();
    }
    HasActiveSpeedBoost() {
      return (
        window.ctx
          .call("KinematicCharacterController.Examples.MovementController", "HasActiveSpeedBoost", [this.ptr])
          .val() === 1
      );
    }
    IsAtLadderBottom() {
      return (
        window.ctx
          .call("KinematicCharacterController.Examples.MovementController", "IsAtLadderBottom", [this.ptr])
          .val() === 1
      );
    }
    IsAtLadderTop() {
      return (
        window.ctx
          .call("KinematicCharacterController.Examples.MovementController", "IsAtLadderTop", [this.ptr])
          .val() === 1
      );
    }
    IsMineController() {
      return (
        window.ctx
          .call("KinematicCharacterController.Examples.MovementController", "IsMineController", [this.ptr])
          .val() === 1
      );
    }
    IsOutsideLadderLateralBounds() {
      return (
        window.ctx
          .call("KinematicCharacterController.Examples.MovementController", "IsOutsideLadderLateralBounds", [this.ptr])
          .val() === 1
      );
    }
    IsStepHandlingAllowed() {
      return (
        window.ctx
          .call("KinematicCharacterController.Examples.MovementController", "IsStepHandlingAllowed", [this.ptr])
          .val() === 1
      );
    }
    JumpForce(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "JumpForce", [this.ptr, arg0]);
    }
    KillMomentum() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "KillMomentum", [this.ptr]);
    }
    OnDisable() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "OnDisable", [this.ptr]);
    }
    OnDiscreteCollisionDetected(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "OnDiscreteCollisionDetected", [
        this.ptr,
        arg0,
      ]);
    }
    OnEnable() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "OnEnable", [this.ptr]);
    }
    OnGroundHit(arg0, arg1, arg2, arg3) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "OnGroundHit", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
      ]);
    }
    OnLanded() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "OnLanded", [this.ptr]);
    }
    OnLeaveStableGround() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "OnLeaveStableGround", [this.ptr]);
    }
    OnMovementHit(arg0, arg1, arg2, arg3) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "OnMovementHit", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
      ]);
    }
    OnTriggerEnter(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "OnTriggerEnter", [this.ptr, arg0]);
    }
    OnTriggerExit(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "OnTriggerExit", [this.ptr, arg0]);
    }
    PostGroundingUpdate(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "PostGroundingUpdate", [
        this.ptr,
        arg0,
      ]);
    }
    ProcessHitStabilityReport(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "ProcessHitStabilityReport", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
      ]);
    }
    RefreshLocalBoostFlag() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "RefreshLocalBoostFlag", [this.ptr]);
    }
    RemoveBoostAfter(arg0, arg1) {
      return window.ctx.call("KinematicCharacterController.Examples.MovementController", "RemoveBoostAfter", [
        this.ptr,
        arg0,
        arg1,
      ]);
    }
    RemoveTermporalBoost(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "RemoveTermporalBoost", [
        this.ptr,
        arg0,
      ]);
    }
    SetInputs(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "SetInputs", [this.ptr, arg0]);
    }
    SetInputsGameMode(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "SetInputsGameMode", [
        this.ptr,
        arg0,
      ]);
    }
    SetInputsLobbyMode(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "SetInputsLobbyMode", [
        this.ptr,
        arg0,
      ]);
    }
    SetRotation(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "SetRotation", [this.ptr, arg0]);
    }
    TryStartSlide() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "TryStartSlide", [this.ptr]);
    }
    Update() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "Update", [this.ptr]);
    }
    UpdateGameMode() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "UpdateGameMode", [this.ptr]);
    }
    UpdateLobbyMode() {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "UpdateLobbyMode", [this.ptr]);
    }
    UpdateRotation(arg0, arg1) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "UpdateRotation", [
        this.ptr,
        arg0,
        arg1,
      ]);
    }
    UpdateVelocity(arg0, arg1) {
      window.ctx.call("KinematicCharacterController.Examples.MovementController", "UpdateVelocity", [
        this.ptr,
        arg0,
        arg1,
      ]);
    }
  }
  class Collider {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get attachedRigidbody() {
      return new Rigidbody(window.ctx.call("UnityEngine.Collider", "get_attachedRigidbody", [this.ptr]));
    }
    get enabled() {
      return window.ctx.call("UnityEngine.Collider", "get_enabled", [this.ptr]).val() === 1;
    }
    set enabled(value) {
      window.ctx.call("UnityEngine.Collider", "set_enabled", [this.ptr, value]);
    }
    set isTrigger(value) {
      window.ctx.call("UnityEngine.Collider", "set_isTrigger", [this.ptr, value]);
    }
    set sharedMaterial(value) {
      window.ctx.call("UnityEngine.Collider", "set_sharedMaterial", [this.ptr, value]);
    }
    ClosestPoint(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Collider", "ClosestPoint", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static ClosestPoint_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Collider", "ClosestPoint_Injected", [arg0, arg1, arg2]);
    }
    static get_attachedRigidbody_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Collider", "get_attachedRigidbody_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_enabled_Injected(arg0) {
      return window.ctx.call("UnityEngine.Collider", "get_enabled_Injected", [arg0]).val() === 1;
    }
    static set_enabled_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Collider", "set_enabled_Injected", [arg0, arg1]);
    }
    static set_isTrigger_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Collider", "set_isTrigger_Injected", [arg0, arg1]);
    }
    static set_sharedMaterial_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Collider", "set_sharedMaterial_Injected", [arg0, arg1]);
    }
  }
  class Rigidbody {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get angularDamping() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_angularDamping", [this.ptr]).val();
    }
    set angularDamping(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_angularDamping", [this.ptr, value]);
    }
    get angularDrag() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_angularDrag", [this.ptr]).val();
    }
    set angularDrag(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_angularDrag", [this.ptr, value]);
    }
    get angularVelocity() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "get_angularVelocity", [out, this.ptr]);
        return out;
      })();
    }
    set angularVelocity(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_angularVelocity", [this.ptr, value]);
    }
    get automaticCenterOfMass() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_automaticCenterOfMass", [this.ptr]).val() === 1;
    }
    set automaticCenterOfMass(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_automaticCenterOfMass", [this.ptr, value]);
    }
    get automaticInertiaTensor() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_automaticInertiaTensor", [this.ptr]).val() === 1;
    }
    set automaticInertiaTensor(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_automaticInertiaTensor", [this.ptr, value]);
    }
    get centerOfMass() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "get_centerOfMass", [out, this.ptr]);
        return out;
      })();
    }
    set centerOfMass(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_centerOfMass", [this.ptr, value]);
    }
    get collisionDetectionMode() {
      return new RigidbodyCollisionDetectionMode(
        window.ctx.call("UnityEngine.Rigidbody", "get_collisionDetectionMode", [this.ptr]),
      );
    }
    set collisionDetectionMode(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_collisionDetectionMode", [this.ptr, value]);
    }
    get constraints() {
      return new RigidbodyConstraints(window.ctx.call("UnityEngine.Rigidbody", "get_constraints", [this.ptr]));
    }
    set constraints(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_constraints", [this.ptr, value]);
    }
    get detectCollisions() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_detectCollisions", [this.ptr]).val() === 1;
    }
    set detectCollisions(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_detectCollisions", [this.ptr, value]);
    }
    get drag() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_drag", [this.ptr]).val();
    }
    set drag(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_drag", [this.ptr, value]);
    }
    get excludeLayers() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Rigidbody", "get_excludeLayers", [out, this.ptr]);
        return out;
      })();
    }
    set excludeLayers(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_excludeLayers", [this.ptr, value]);
    }
    get freezeRotation() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_freezeRotation", [this.ptr]).val() === 1;
    }
    set freezeRotation(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_freezeRotation", [this.ptr, value]);
    }
    get includeLayers() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Rigidbody", "get_includeLayers", [out, this.ptr]);
        return out;
      })();
    }
    set includeLayers(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_includeLayers", [this.ptr, value]);
    }
    get inertiaTensor() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "get_inertiaTensor", [out, this.ptr]);
        return out;
      })();
    }
    set inertiaTensor(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_inertiaTensor", [this.ptr, value]);
    }
    get inertiaTensorRotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Rigidbody", "get_inertiaTensorRotation", [out, this.ptr]);
        return out;
      })();
    }
    set inertiaTensorRotation(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_inertiaTensorRotation", [this.ptr, value]);
    }
    get interpolation() {
      return new RigidbodyInterpolation(window.ctx.call("UnityEngine.Rigidbody", "get_interpolation", [this.ptr]));
    }
    set interpolation(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_interpolation", [this.ptr, value]);
    }
    get isKinematic() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_isKinematic", [this.ptr]).val() === 1;
    }
    set isKinematic(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_isKinematic", [this.ptr, value]);
    }
    get linearDamping() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_linearDamping", [this.ptr]).val();
    }
    set linearDamping(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_linearDamping", [this.ptr, value]);
    }
    get linearVelocity() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "get_linearVelocity", [out, this.ptr]);
        return out;
      })();
    }
    set linearVelocity(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_linearVelocity", [this.ptr, value]);
    }
    get mass() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_mass", [this.ptr]).val();
    }
    set mass(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_mass", [this.ptr, value]);
    }
    get maxAngularVelocity() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_maxAngularVelocity", [this.ptr]).val();
    }
    set maxAngularVelocity(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_maxAngularVelocity", [this.ptr, value]);
    }
    get maxDepenetrationVelocity() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_maxDepenetrationVelocity", [this.ptr]).val();
    }
    set maxDepenetrationVelocity(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_maxDepenetrationVelocity", [this.ptr, value]);
    }
    get maxLinearVelocity() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_maxLinearVelocity", [this.ptr]).val();
    }
    set maxLinearVelocity(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_maxLinearVelocity", [this.ptr, value]);
    }
    get position() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "get_position", [out, this.ptr]);
        return out;
      })();
    }
    set position(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_position", [this.ptr, value]);
    }
    get rotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Rigidbody", "get_rotation", [out, this.ptr]);
        return out;
      })();
    }
    set rotation(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_rotation", [this.ptr, value]);
    }
    get sleepThreshold() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_sleepThreshold", [this.ptr]).val();
    }
    set sleepThreshold(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_sleepThreshold", [this.ptr, value]);
    }
    get solverIterations() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_solverIterations", [this.ptr]).val();
    }
    set solverIterations(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_solverIterations", [this.ptr, value]);
    }
    get solverVelocityIterations() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_solverVelocityIterations", [this.ptr]).val();
    }
    set solverVelocityIterations(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_solverVelocityIterations", [this.ptr, value]);
    }
    get useGravity() {
      return window.ctx.call("UnityEngine.Rigidbody", "get_useGravity", [this.ptr]).val() === 1;
    }
    set useGravity(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_useGravity", [this.ptr, value]);
    }
    get velocity() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "get_velocity", [out, this.ptr]);
        return out;
      })();
    }
    set velocity(value) {
      window.ctx.call("UnityEngine.Rigidbody", "set_velocity", [this.ptr, value]);
    }
    get worldCenterOfMass() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "get_worldCenterOfMass", [out, this.ptr]);
        return out;
      })();
    }
    get worldInertiaTensorMatrix() {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Rigidbody", "get_worldInertiaTensorMatrix", [out, this.ptr]);
        return out;
      })();
    }
    AddExplosionForce_explosionForce_explosionPosition_explosionRadius_upwardsModifier_mode(
      explosionForce,
      explosionPosition,
      explosionRadius,
      upwardsModifier,
      mode,
    ) {
      window.ctx.call("UnityEngine.Rigidbody", "AddExplosionForce_26947", [
        this.ptr,
        explosionForce,
        explosionPosition,
        explosionRadius,
        upwardsModifier,
        mode,
      ]);
    }
    AddExplosionForce_explosionForce_explosionPosition_explosionRadius_upwardsModifier(
      explosionForce,
      explosionPosition,
      explosionRadius,
      upwardsModifier,
    ) {
      window.ctx.call("UnityEngine.Rigidbody", "AddExplosionForce_26948", [
        this.ptr,
        explosionForce,
        explosionPosition,
        explosionRadius,
        upwardsModifier,
      ]);
    }
    AddExplosionForce_explosionForce_explosionPosition_explosionRadius(
      explosionForce,
      explosionPosition,
      explosionRadius,
    ) {
      window.ctx.call("UnityEngine.Rigidbody", "AddExplosionForce_26949", [
        this.ptr,
        explosionForce,
        explosionPosition,
        explosionRadius,
      ]);
    }
    static AddExplosionForce_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.Rigidbody", "AddExplosionForce_Injected", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    AddForce_force_mode(force, mode) {
      window.ctx.call("UnityEngine.Rigidbody", "AddForce_26929", [this.ptr, force, mode]);
    }
    AddForce_force(force) {
      window.ctx.call("UnityEngine.Rigidbody", "AddForce_26930", [this.ptr, force]);
    }
    AddForce_x_y_z_mode(x, y, z, mode) {
      window.ctx.call("UnityEngine.Rigidbody", "AddForce_26931", [this.ptr, x, y, z, mode]);
    }
    AddForce_x_y_z(x, y, z) {
      window.ctx.call("UnityEngine.Rigidbody", "AddForce_26932", [this.ptr, x, y, z]);
    }
    AddForceAtPosition_force_position_mode(force, position, mode) {
      window.ctx.call("UnityEngine.Rigidbody", "AddForceAtPosition_26945", [this.ptr, force, position, mode]);
    }
    AddForceAtPosition_force_position(force, position) {
      window.ctx.call("UnityEngine.Rigidbody", "AddForceAtPosition_26946", [this.ptr, force, position]);
    }
    static AddForceAtPosition_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Rigidbody", "AddForceAtPosition_Injected", [arg0, arg1, arg2, arg3]);
    }
    static AddForce_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Rigidbody", "AddForce_Injected", [arg0, arg1, arg2]);
    }
    AddRelativeForce_force_mode(force, mode) {
      window.ctx.call("UnityEngine.Rigidbody", "AddRelativeForce_26933", [this.ptr, force, mode]);
    }
    AddRelativeForce_force(force) {
      window.ctx.call("UnityEngine.Rigidbody", "AddRelativeForce_26934", [this.ptr, force]);
    }
    AddRelativeForce_x_y_z_mode(x, y, z, mode) {
      window.ctx.call("UnityEngine.Rigidbody", "AddRelativeForce_26935", [this.ptr, x, y, z, mode]);
    }
    AddRelativeForce_x_y_z(x, y, z) {
      window.ctx.call("UnityEngine.Rigidbody", "AddRelativeForce_26936", [this.ptr, x, y, z]);
    }
    static AddRelativeForce_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Rigidbody", "AddRelativeForce_Injected", [arg0, arg1, arg2]);
    }
    AddRelativeTorque_torque_mode(torque, mode) {
      window.ctx.call("UnityEngine.Rigidbody", "AddRelativeTorque_26941", [this.ptr, torque, mode]);
    }
    AddRelativeTorque_torque(torque) {
      window.ctx.call("UnityEngine.Rigidbody", "AddRelativeTorque_26942", [this.ptr, torque]);
    }
    AddRelativeTorque_x_y_z_mode(x, y, z, mode) {
      window.ctx.call("UnityEngine.Rigidbody", "AddRelativeTorque_26943", [this.ptr, x, y, z, mode]);
    }
    AddRelativeTorque_x_y_z(x, y, z) {
      window.ctx.call("UnityEngine.Rigidbody", "AddRelativeTorque_26944", [this.ptr, x, y, z]);
    }
    static AddRelativeTorque_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Rigidbody", "AddRelativeTorque_Injected", [arg0, arg1, arg2]);
    }
    AddTorque_torque_mode(torque, mode) {
      window.ctx.call("UnityEngine.Rigidbody", "AddTorque_26937", [this.ptr, torque, mode]);
    }
    AddTorque_torque(torque) {
      window.ctx.call("UnityEngine.Rigidbody", "AddTorque_26938", [this.ptr, torque]);
    }
    AddTorque_x_y_z_mode(x, y, z, mode) {
      window.ctx.call("UnityEngine.Rigidbody", "AddTorque_26939", [this.ptr, x, y, z, mode]);
    }
    AddTorque_x_y_z(x, y, z) {
      window.ctx.call("UnityEngine.Rigidbody", "AddTorque_26940", [this.ptr, x, y, z]);
    }
    static AddTorque_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Rigidbody", "AddTorque_Injected", [arg0, arg1, arg2]);
    }
    ClosestPointOnBounds(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "ClosestPointOnBounds", [out, this.ptr, arg0]);
        return out;
      })();
    }
    GetAccumulatedForce_step(step) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "GetAccumulatedForce_26925", [out, this.ptr, step]);
        return out;
      })();
    }
    GetAccumulatedForce_pointer() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "GetAccumulatedForce_26926", [out, this.ptr]);
        return out;
      })();
    }
    static GetAccumulatedForce_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Rigidbody", "GetAccumulatedForce_Injected", [arg0, arg1, arg2]);
    }
    GetAccumulatedTorque_step(step) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "GetAccumulatedTorque_26927", [out, this.ptr, step]);
        return out;
      })();
    }
    GetAccumulatedTorque_pointer() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "GetAccumulatedTorque_26928", [out, this.ptr]);
        return out;
      })();
    }
    static GetAccumulatedTorque_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Rigidbody", "GetAccumulatedTorque_Injected", [arg0, arg1, arg2]);
    }
    GetPointVelocity(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "GetPointVelocity", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetPointVelocity_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Rigidbody", "GetPointVelocity_Injected", [arg0, arg1, arg2]);
    }
    GetRelativePointVelocity(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Rigidbody", "GetRelativePointVelocity", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetRelativePointVelocity_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Rigidbody", "GetRelativePointVelocity_Injected", [arg0, arg1, arg2]);
    }
    Internal_ClosestPointOnBounds(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Rigidbody", "Internal_ClosestPointOnBounds", [this.ptr, arg0, arg1, arg2]);
    }
    static Internal_ClosestPointOnBounds_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Rigidbody", "Internal_ClosestPointOnBounds_Injected", [arg0, arg1, arg2, arg3]);
    }
    Internal_SweepTestAll(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Rigidbody", "Internal_SweepTestAll", [this.ptr, arg0, arg1, arg2]);
    }
    static Internal_SweepTestAll_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Rigidbody", "Internal_SweepTestAll_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    IsSleeping() {
      return window.ctx.call("UnityEngine.Rigidbody", "IsSleeping", [this.ptr]).val() === 1;
    }
    static IsSleeping_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "IsSleeping_Injected", [arg0]).val() === 1;
    }
    Move(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "Move", [this.ptr, arg0, arg1]);
    }
    MovePosition(arg0) {
      window.ctx.call("UnityEngine.Rigidbody", "MovePosition", [this.ptr, arg0]);
    }
    static MovePosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "MovePosition_Injected", [arg0, arg1]);
    }
    MoveRotation(arg0) {
      window.ctx.call("UnityEngine.Rigidbody", "MoveRotation", [this.ptr, arg0]);
    }
    static MoveRotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "MoveRotation_Injected", [arg0, arg1]);
    }
    static Move_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Rigidbody", "Move_Injected", [arg0, arg1, arg2]);
    }
    PublishTransform() {
      window.ctx.call("UnityEngine.Rigidbody", "PublishTransform", [this.ptr]);
    }
    static PublishTransform_Injected(arg0) {
      window.ctx.call("UnityEngine.Rigidbody", "PublishTransform_Injected", [arg0]);
    }
    ResetCenterOfMass() {
      window.ctx.call("UnityEngine.Rigidbody", "ResetCenterOfMass", [this.ptr]);
    }
    static ResetCenterOfMass_Injected(arg0) {
      window.ctx.call("UnityEngine.Rigidbody", "ResetCenterOfMass_Injected", [arg0]);
    }
    ResetInertiaTensor() {
      window.ctx.call("UnityEngine.Rigidbody", "ResetInertiaTensor", [this.ptr]);
    }
    static ResetInertiaTensor_Injected(arg0) {
      window.ctx.call("UnityEngine.Rigidbody", "ResetInertiaTensor_Injected", [arg0]);
    }
    SetDensity(arg0) {
      window.ctx.call("UnityEngine.Rigidbody", "SetDensity", [this.ptr, arg0]);
    }
    Sleep() {
      window.ctx.call("UnityEngine.Rigidbody", "Sleep", [this.ptr]);
    }
    static Sleep_Injected(arg0) {
      window.ctx.call("UnityEngine.Rigidbody", "Sleep_Injected", [arg0]);
    }
    SweepTest_direction_maxDistance_queryTriggerInteraction_hasHit(
      direction,
      maxDistance,
      queryTriggerInteraction,
      hasHit,
    ) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Rigidbody", "SweepTest_26952", [
          out,
          this.ptr,
          direction,
          maxDistance,
          queryTriggerInteraction,
          hasHit,
        ]);
        return out;
      })();
    }
    SweepTest_direction_hitInfo_maxDistance_queryTriggerInteraction(
      direction,
      hitInfo,
      maxDistance,
      queryTriggerInteraction,
    ) {
      return (
        window.ctx
          .call("UnityEngine.Rigidbody", "SweepTest_26953", [
            this.ptr,
            direction,
            hitInfo,
            maxDistance,
            queryTriggerInteraction,
          ])
          .val() === 1
      );
    }
    SweepTest_direction_hitInfo_maxDistance(direction, hitInfo, maxDistance) {
      return (
        window.ctx
          .call("UnityEngine.Rigidbody", "SweepTest_26954", [this.ptr, direction, hitInfo, maxDistance])
          .val() === 1
      );
    }
    SweepTest_direction_hitInfo(direction, hitInfo) {
      return window.ctx.call("UnityEngine.Rigidbody", "SweepTest_26955", [this.ptr, direction, hitInfo]).val() === 1;
    }
    SweepTestAll_direction_maxDistance_queryTriggerInteraction(direction, maxDistance, queryTriggerInteraction) {
      return window.ctx.call("UnityEngine.Rigidbody", "SweepTestAll_26957", [
        this.ptr,
        direction,
        maxDistance,
        queryTriggerInteraction,
      ]);
    }
    SweepTestAll_direction_maxDistance(direction, maxDistance) {
      return window.ctx.call("UnityEngine.Rigidbody", "SweepTestAll_26958", [this.ptr, direction, maxDistance]);
    }
    SweepTestAll_direction(direction) {
      return window.ctx.call("UnityEngine.Rigidbody", "SweepTestAll_26959", [this.ptr, direction]);
    }
    static SweepTest_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.Rigidbody", "SweepTest_Injected", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    WakeUp() {
      window.ctx.call("UnityEngine.Rigidbody", "WakeUp", [this.ptr]);
    }
    static WakeUp_Injected(arg0) {
      window.ctx.call("UnityEngine.Rigidbody", "WakeUp_Injected", [arg0]);
    }
    static get_angularDamping_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_angularDamping_Injected", [arg0]).val();
    }
    static get_angularVelocity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_angularVelocity_Injected", [arg0, arg1]);
    }
    static get_automaticCenterOfMass_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_automaticCenterOfMass_Injected", [arg0]).val() === 1;
    }
    static get_automaticInertiaTensor_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_automaticInertiaTensor_Injected", [arg0]).val() === 1;
    }
    static get_centerOfMass_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_centerOfMass_Injected", [arg0, arg1]);
    }
    static get_collisionDetectionMode_Injected(arg0) {
      return new RigidbodyCollisionDetectionMode(
        window.ctx.call("UnityEngine.Rigidbody", "get_collisionDetectionMode_Injected", [arg0]),
      );
    }
    static get_constraints_Injected(arg0) {
      return new RigidbodyConstraints(window.ctx.call("UnityEngine.Rigidbody", "get_constraints_Injected", [arg0]));
    }
    static get_detectCollisions_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_detectCollisions_Injected", [arg0]).val() === 1;
    }
    static get_excludeLayers_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_excludeLayers_Injected", [arg0, arg1]);
    }
    static get_includeLayers_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_includeLayers_Injected", [arg0, arg1]);
    }
    static get_inertiaTensorRotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_inertiaTensorRotation_Injected", [arg0, arg1]);
    }
    static get_inertiaTensor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_inertiaTensor_Injected", [arg0, arg1]);
    }
    static get_interpolation_Injected(arg0) {
      return new RigidbodyInterpolation(window.ctx.call("UnityEngine.Rigidbody", "get_interpolation_Injected", [arg0]));
    }
    static get_isKinematic_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_isKinematic_Injected", [arg0]).val() === 1;
    }
    static get_linearDamping_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_linearDamping_Injected", [arg0]).val();
    }
    static get_linearVelocity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_linearVelocity_Injected", [arg0, arg1]);
    }
    static get_mass_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_mass_Injected", [arg0]).val();
    }
    static get_maxAngularVelocity_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_maxAngularVelocity_Injected", [arg0]).val();
    }
    static get_maxDepenetrationVelocity_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_maxDepenetrationVelocity_Injected", [arg0]).val();
    }
    static get_maxLinearVelocity_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_maxLinearVelocity_Injected", [arg0]).val();
    }
    static get_position_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_position_Injected", [arg0, arg1]);
    }
    static get_rotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_rotation_Injected", [arg0, arg1]);
    }
    static get_sleepThreshold_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_sleepThreshold_Injected", [arg0]).val();
    }
    static get_solverIterations_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_solverIterations_Injected", [arg0]).val();
    }
    static get_solverVelocityIterations_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_solverVelocityIterations_Injected", [arg0]).val();
    }
    static get_useGravity_Injected(arg0) {
      return window.ctx.call("UnityEngine.Rigidbody", "get_useGravity_Injected", [arg0]).val() === 1;
    }
    static get_worldCenterOfMass_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_worldCenterOfMass_Injected", [arg0, arg1]);
    }
    static get_worldInertiaTensorMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "get_worldInertiaTensorMatrix_Injected", [arg0, arg1]);
    }
    static set_angularDamping_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_angularDamping_Injected", [arg0, arg1]);
    }
    static set_angularVelocity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_angularVelocity_Injected", [arg0, arg1]);
    }
    static set_automaticCenterOfMass_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_automaticCenterOfMass_Injected", [arg0, arg1]);
    }
    static set_automaticInertiaTensor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_automaticInertiaTensor_Injected", [arg0, arg1]);
    }
    static set_centerOfMass_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_centerOfMass_Injected", [arg0, arg1]);
    }
    static set_collisionDetectionMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_collisionDetectionMode_Injected", [arg0, arg1]);
    }
    static set_constraints_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_constraints_Injected", [arg0, arg1]);
    }
    static set_detectCollisions_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_detectCollisions_Injected", [arg0, arg1]);
    }
    static set_excludeLayers_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_excludeLayers_Injected", [arg0, arg1]);
    }
    static set_includeLayers_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_includeLayers_Injected", [arg0, arg1]);
    }
    static set_inertiaTensorRotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_inertiaTensorRotation_Injected", [arg0, arg1]);
    }
    static set_inertiaTensor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_inertiaTensor_Injected", [arg0, arg1]);
    }
    static set_interpolation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_interpolation_Injected", [arg0, arg1]);
    }
    static set_isKinematic_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_isKinematic_Injected", [arg0, arg1]);
    }
    static set_linearDamping_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_linearDamping_Injected", [arg0, arg1]);
    }
    static set_linearVelocity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_linearVelocity_Injected", [arg0, arg1]);
    }
    static set_mass_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_mass_Injected", [arg0, arg1]);
    }
    static set_maxAngularVelocity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_maxAngularVelocity_Injected", [arg0, arg1]);
    }
    static set_maxDepenetrationVelocity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_maxDepenetrationVelocity_Injected", [arg0, arg1]);
    }
    static set_maxLinearVelocity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_maxLinearVelocity_Injected", [arg0, arg1]);
    }
    static set_position_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_position_Injected", [arg0, arg1]);
    }
    static set_rotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_rotation_Injected", [arg0, arg1]);
    }
    static set_sleepThreshold_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_sleepThreshold_Injected", [arg0, arg1]);
    }
    static set_solverIterations_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_solverIterations_Injected", [arg0, arg1]);
    }
    static set_solverVelocityIterations_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_solverVelocityIterations_Injected", [arg0, arg1]);
    }
    static set_useGravity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Rigidbody", "set_useGravity_Injected", [arg0, arg1]);
    }
  }
  class ColyView {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get ActorNumber() {
      return window.ctx.call("ColyView", "get_ActorNumber", [this.ptr]).val();
    }
    get HasInitialized() {
      return window.ctx.call("ColyView", "get_HasInitialized", [this.ptr]).val() === 1;
    }
    static get Mine() {
      return new ColyView(window.ctx.call("ColyView", "get_Mine", []));
    }
    get Nickname() {
      return window.ctx.call("ColyView", "get_Nickname", [this.ptr]);
    }
    get BeforeDespawn() {
      return this.ptr.readField(24, "i32");
    }
    set BeforeDespawn(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get IsAI() {
      return this.ptr.readField(16, "i32").val() === 1;
    }
    set IsAI(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get allColyBehaviours() {
      return JSArray(this.ptr.readField(40, "i32"));
    }
    set allColyBehaviours(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get colyAI() {
      return new ColyAI(this.ptr.readField(20, "i32"));
    }
    set colyAI(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get isMine() {
      return this.ptr.readField(28, "i32").val() === 1;
    }
    set isMine(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get playerState() {
      return new PlayerState(this.ptr.readField(36, "i32"));
    }
    set playerState(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get sessionId() {
      return this.ptr.readField(32, "i32").mstr();
    }
    set sessionId(value) {
      return this.ptr.writeField(32, "i32", window.ctx.createMstr(value));
    }
    get spawnTime() {
      return this.ptr.readField(44, "f32").val();
    }
    set spawnTime(value) {
      return this.ptr.writeField(44, "f32", value);
    }
    static Find(arg0) {
      return new ColyView(window.ctx.call("ColyView", "Find", [arg0]));
    }
    HandleBeforeDespawn() {
      window.ctx.call("ColyView", "HandleBeforeDespawn", [this.ptr]);
    }
    Init(arg0) {
      window.ctx.call("ColyView", "Init", [this.ptr, arg0]);
    }
    static TryFind(arg0, arg1) {
      return window.ctx.call("ColyView", "TryFind", [arg0, arg1]).val() === 1;
    }
    static TryFindMine(arg0) {
      return window.ctx.call("ColyView", "TryFindMine", [arg0]).val() === 1;
    }
    TryGetColyBehaviour(arg0) {
      return window.ctx.call("ColyView", "TryGetColyBehaviour", [this.ptr, arg0]).val() === 1;
    }
  }
  class DeadCamera {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get ALLOW_SPAWN_AFTER() {
      return window.ctx.call("DeadCamera", "get_ALLOW_SPAWN_AFTER", [this.ptr]).val();
    }
    get AUTO_SPAWN_AFTER() {
      return window.ctx.call("DeadCamera", "get_AUTO_SPAWN_AFTER", [this.ptr]).val();
    }
    get dieAtPosition() {
      return new Vector3(this.ptr.readField(60, "i32"));
    }
    set dieAtPosition(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get fillImageRespawnTimer() {
      return new UIImage(this.ptr.readField(28, "i32"));
    }
    set fillImageRespawnTimer(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get initTime() {
      return this.ptr.readField(52, "f32").val();
    }
    set initTime(value) {
      return this.ptr.writeField(52, "f32", value);
    }
    get interactablePanel() {
      return new GameObject(this.ptr.readField(36, "i32"));
    }
    set interactablePanel(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get isFirstKillerSet() {
      return this.ptr.readField(72, "i32").val() === 1;
    }
    set isFirstKillerSet(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get killer() {
      return new ColyView(this.ptr.readField(44, "i32"));
    }
    set killer(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get myView() {
      return new ColyView(this.ptr.readField(56, "i32"));
    }
    set myView(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get playerCardInfo() {
      return new PlayerCardInfo(this.ptr.readField(20, "i32"));
    }
    set playerCardInfo(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get respawnIcon() {
      return new GameObject(this.ptr.readField(24, "i32"));
    }
    set respawnIcon(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get respawnInTxt() {
      return this.ptr.readField(40, "i32");
    }
    set respawnInTxt(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get respawnTimerTxt() {
      return this.ptr.readField(32, "i32");
    }
    set respawnTimerTxt(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get respawnTween() {
      return new Tween(this.ptr.readField(48, "i32"));
    }
    set respawnTween(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    get respawningUIParent() {
      return new GameObject(this.ptr.readField(16, "i32"));
    }
    set respawningUIParent(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    _Init_b_21_0(arg0) {
      window.ctx.call("DeadCamera", "<Init>b__21_0", [this.ptr, arg0]);
    }
    _Init_b_21_1() {
      window.ctx.call("DeadCamera", "<Init>b__21_1", [this.ptr]);
    }
    HandleKiller(arg0, arg1) {
      window.ctx.call("DeadCamera", "HandleKiller", [this.ptr, arg0, arg1]);
    }
    Init(arg0) {
      window.ctx.call("DeadCamera", "Init", [this.ptr, arg0]);
    }
    LockCamera() {
      window.ctx.call("DeadCamera", "LockCamera", [this.ptr]);
    }
    OnDisable() {
      window.ctx.call("DeadCamera", "OnDisable", [this.ptr]);
    }
    OnEnable() {
      window.ctx.call("DeadCamera", "OnEnable", [this.ptr]);
    }
    PositionTick(arg0) {
      window.ctx.call("DeadCamera", "PositionTick", [this.ptr, arg0]);
    }
    Respawn() {
      window.ctx.call("DeadCamera", "Respawn", [this.ptr]);
    }
    RespawnButtonPressed() {
      window.ctx.call("DeadCamera", "RespawnButtonPressed", [this.ptr]);
    }
    RespawnKeyDown() {
      return window.ctx.call("DeadCamera", "RespawnKeyDown", [this.ptr]).val() === 1;
    }
    RotationTick(arg0) {
      window.ctx.call("DeadCamera", "RotationTick", [this.ptr, arg0]);
    }
    Update() {
      window.ctx.call("DeadCamera", "Update", [this.ptr]);
    }
  }
  class NeckController {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get neckBone() {
      return new Transform(this.ptr.readField(16, "i32"));
    }
    set neckBone(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get neckRotation() {
      return this.ptr.readField(20, "f32").val();
    }
    set neckRotation(value) {
      return this.ptr.writeField(20, "f32", value);
    }
    LateUpdate() {
      window.ctx.call("NeckController", "LateUpdate", [this.ptr]);
    }
    SetLocalXRot(arg0) {
      window.ctx.call("NeckController", "SetLocalXRot", [this.ptr, arg0]);
    }
  }
  class Component {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get gameObject() {
      return new GameObject(window.ctx.call("UnityEngine.Component", "get_gameObject", [this.ptr]));
    }
    get tag() {
      return window.ctx.call("UnityEngine.Component", "get_tag", [this.ptr]);
    }
    get transform() {
      return new Transform(window.ctx.call("UnityEngine.Component", "get_transform", [this.ptr]));
    }
    CompareTag(arg0) {
      return window.ctx.call("UnityEngine.Component", "CompareTag", [this.ptr, arg0]).val() === 1;
    }
    GetComponent_type(type) {
      return new Component(window.ctx.call("UnityEngine.Component", "GetComponent_23775", [this.ptr, type]));
    }
    GetComponent() {
      return window.ctx.call("UnityEngine.Component", "GetComponent", [this.ptr]);
    }
    GetComponentInChildren_t_includeInactive(t, includeInactive) {
      return new Component(
        window.ctx.call("UnityEngine.Component", "GetComponentInChildren_23777", [this.ptr, t, includeInactive]),
      );
    }
    GetComponentInChildren() {
      return window.ctx.call("UnityEngine.Component", "GetComponentInChildren", [this.ptr]);
    }
    GetComponentInParent_t_includeInactive(t, includeInactive) {
      return new Component(
        window.ctx.call("UnityEngine.Component", "GetComponentInParent_23778", [this.ptr, t, includeInactive]),
      );
    }
    GetComponentInParent() {
      return window.ctx.call("UnityEngine.Component", "GetComponentInParent", [this.ptr]);
    }
    GetComponents_type_results(type, results) {
      window.ctx.call("UnityEngine.Component", "GetComponents_23780", [this.ptr, type, results]);
    }
    GetComponents(arg0) {
      window.ctx.call("UnityEngine.Component", "GetComponents", [this.ptr, arg0]);
    }
    GetComponents() {
      return window.ctx.call("UnityEngine.Component", "GetComponents", [this.ptr]);
    }
    GetComponentsForListInternal(arg0, arg1) {
      window.ctx.call("UnityEngine.Component", "GetComponentsForListInternal", [this.ptr, arg0, arg1]);
    }
    static GetComponentsForListInternal_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Component", "GetComponentsForListInternal_Injected", [arg0, arg1, arg2]);
    }
    GetComponentsInChildren(arg0) {
      return window.ctx.call("UnityEngine.Component", "GetComponentsInChildren", [this.ptr, arg0]);
    }
    GetComponentsInChildren(arg0, arg1) {
      window.ctx.call("UnityEngine.Component", "GetComponentsInChildren", [this.ptr, arg0, arg1]);
    }
    GetComponentsInChildren() {
      return window.ctx.call("UnityEngine.Component", "GetComponentsInChildren", [this.ptr]);
    }
    GetComponentsInChildren(arg0) {
      window.ctx.call("UnityEngine.Component", "GetComponentsInChildren", [this.ptr, arg0]);
    }
    GetComponentsInParent(arg0) {
      return window.ctx.call("UnityEngine.Component", "GetComponentsInParent", [this.ptr, arg0]);
    }
    GetComponentsInParent(arg0, arg1) {
      window.ctx.call("UnityEngine.Component", "GetComponentsInParent", [this.ptr, arg0, arg1]);
    }
    GetComponentsInParent() {
      return window.ctx.call("UnityEngine.Component", "GetComponentsInParent", [this.ptr]);
    }
    TryGetComponent_type_component(type, component) {
      return window.ctx.call("UnityEngine.Component", "TryGetComponent_23776", [this.ptr, type, component]).val() === 1;
    }
    TryGetComponent(arg0) {
      return window.ctx.call("UnityEngine.Component", "TryGetComponent", [this.ptr, arg0]).val() === 1;
    }
    static get_gameObject_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Component", "get_gameObject_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_transform_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Component", "get_transform_Injected", [out, arg0]);
        return out;
      })();
    }
  }
  class Transform {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get childCount() {
      return window.ctx.call("UnityEngine.Transform", "get_childCount", [this.ptr]).val();
    }
    get constrainProportionsScale() {
      return window.ctx.call("UnityEngine.Transform", "get_constrainProportionsScale", [this.ptr]).val() === 1;
    }
    set constrainProportionsScale(value) {
      window.ctx.call("UnityEngine.Transform", "set_constrainProportionsScale", [this.ptr, value]);
    }
    get eulerAngles() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "get_eulerAngles", [out, this.ptr]);
        return out;
      })();
    }
    set eulerAngles(value) {
      window.ctx.call("UnityEngine.Transform", "set_eulerAngles", [this.ptr, value]);
    }
    get forward() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "get_forward", [out, this.ptr]);
        return out;
      })();
    }
    set forward(value) {
      window.ctx.call("UnityEngine.Transform", "set_forward", [this.ptr, value]);
    }
    get hasChanged() {
      return window.ctx.call("UnityEngine.Transform", "get_hasChanged", [this.ptr]).val() === 1;
    }
    set hasChanged(value) {
      window.ctx.call("UnityEngine.Transform", "set_hasChanged", [this.ptr, value]);
    }
    get hierarchyCapacity() {
      return window.ctx.call("UnityEngine.Transform", "get_hierarchyCapacity", [this.ptr]).val();
    }
    set hierarchyCapacity(value) {
      window.ctx.call("UnityEngine.Transform", "set_hierarchyCapacity", [this.ptr, value]);
    }
    get hierarchyCount() {
      return window.ctx.call("UnityEngine.Transform", "get_hierarchyCount", [this.ptr]).val();
    }
    get localEulerAngles() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "get_localEulerAngles", [out, this.ptr]);
        return out;
      })();
    }
    set localEulerAngles(value) {
      window.ctx.call("UnityEngine.Transform", "set_localEulerAngles", [this.ptr, value]);
    }
    get localPosition() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "get_localPosition", [out, this.ptr]);
        return out;
      })();
    }
    set localPosition(value) {
      window.ctx.call("UnityEngine.Transform", "set_localPosition", [this.ptr, value]);
    }
    get localRotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Transform", "get_localRotation", [out, this.ptr]);
        return out;
      })();
    }
    set localRotation(value) {
      window.ctx.call("UnityEngine.Transform", "set_localRotation", [this.ptr, value]);
    }
    get localScale() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "get_localScale", [out, this.ptr]);
        return out;
      })();
    }
    set localScale(value) {
      window.ctx.call("UnityEngine.Transform", "set_localScale", [this.ptr, value]);
    }
    get localToWorldMatrix() {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Transform", "get_localToWorldMatrix", [out, this.ptr]);
        return out;
      })();
    }
    get lossyScale() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "get_lossyScale", [out, this.ptr]);
        return out;
      })();
    }
    get parent() {
      return new Transform(window.ctx.call("UnityEngine.Transform", "get_parent", [this.ptr]));
    }
    set parent(value) {
      window.ctx.call("UnityEngine.Transform", "set_parent", [this.ptr, value]);
    }
    get parentInternal() {
      return new Transform(window.ctx.call("UnityEngine.Transform", "get_parentInternal", [this.ptr]));
    }
    set parentInternal(value) {
      window.ctx.call("UnityEngine.Transform", "set_parentInternal", [this.ptr, value]);
    }
    get position() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "get_position", [out, this.ptr]);
        return out;
      })();
    }
    set position(value) {
      window.ctx.call("UnityEngine.Transform", "set_position", [this.ptr, value]);
    }
    get right() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "get_right", [out, this.ptr]);
        return out;
      })();
    }
    set right(value) {
      window.ctx.call("UnityEngine.Transform", "set_right", [this.ptr, value]);
    }
    get root() {
      return new Transform(window.ctx.call("UnityEngine.Transform", "get_root", [this.ptr]));
    }
    get rotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Transform", "get_rotation", [out, this.ptr]);
        return out;
      })();
    }
    set rotation(value) {
      window.ctx.call("UnityEngine.Transform", "set_rotation", [this.ptr, value]);
    }
    get rotationOrder() {
      return new RotationOrder(window.ctx.call("UnityEngine.Transform", "get_rotationOrder", [this.ptr]));
    }
    set rotationOrder(value) {
      window.ctx.call("UnityEngine.Transform", "set_rotationOrder", [this.ptr, value]);
    }
    get up() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "get_up", [out, this.ptr]);
        return out;
      })();
    }
    set up(value) {
      window.ctx.call("UnityEngine.Transform", "set_up", [this.ptr, value]);
    }
    get worldToLocalMatrix() {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Transform", "get_worldToLocalMatrix", [out, this.ptr]);
        return out;
      })();
    }
    DetachChildren() {
      window.ctx.call("UnityEngine.Transform", "DetachChildren", [this.ptr]);
    }
    static DetachChildren_Injected(arg0) {
      window.ctx.call("UnityEngine.Transform", "DetachChildren_Injected", [arg0]);
    }
    Find(arg0) {
      return new Transform(window.ctx.call("UnityEngine.Transform", "Find", [this.ptr, arg0]));
    }
    FindChild(arg0) {
      return new Transform(window.ctx.call("UnityEngine.Transform", "FindChild", [this.ptr, arg0]));
    }
    FindRelativeTransformWithPath(arg0, arg1) {
      return new Transform(
        window.ctx.call("UnityEngine.Transform", "FindRelativeTransformWithPath", [this.ptr, arg0, arg1]),
      );
    }
    static FindRelativeTransformWithPath_Injected(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Transform", "FindRelativeTransformWithPath_Injected", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    GetChild(arg0) {
      return new Transform(window.ctx.call("UnityEngine.Transform", "GetChild", [this.ptr, arg0]));
    }
    GetChildCount() {
      return window.ctx.call("UnityEngine.Transform", "GetChildCount", [this.ptr]).val();
    }
    static GetChildCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Transform", "GetChildCount_Injected", [arg0]).val();
    }
    static GetChild_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Transform", "GetChild_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    GetEnumerator() {
      return window.ctx.call("UnityEngine.Transform", "GetEnumerator", [this.ptr]);
    }
    GetLocalEulerAngles(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "GetLocalEulerAngles", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetLocalEulerAngles_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "GetLocalEulerAngles_Injected", [arg0, arg1, arg2]);
    }
    GetLocalPositionAndRotation(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "GetLocalPositionAndRotation", [this.ptr, arg0, arg1]);
    }
    static GetLocalPositionAndRotation_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "GetLocalPositionAndRotation_Injected", [arg0, arg1, arg2]);
    }
    GetParent() {
      return new Transform(window.ctx.call("UnityEngine.Transform", "GetParent", [this.ptr]));
    }
    static GetParent_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Transform", "GetParent_Injected", [out, arg0]);
        return out;
      })();
    }
    GetPositionAndRotation(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "GetPositionAndRotation", [this.ptr, arg0, arg1]);
    }
    static GetPositionAndRotation_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "GetPositionAndRotation_Injected", [arg0, arg1, arg2]);
    }
    GetRoot() {
      return new Transform(window.ctx.call("UnityEngine.Transform", "GetRoot", [this.ptr]));
    }
    static GetRoot_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Transform", "GetRoot_Injected", [out, arg0]);
        return out;
      })();
    }
    GetRotationOrderInternal() {
      return window.ctx.call("UnityEngine.Transform", "GetRotationOrderInternal", [this.ptr]).val();
    }
    static GetRotationOrderInternal_Injected(arg0) {
      return window.ctx.call("UnityEngine.Transform", "GetRotationOrderInternal_Injected", [arg0]).val();
    }
    GetSiblingIndex() {
      return window.ctx.call("UnityEngine.Transform", "GetSiblingIndex", [this.ptr]).val();
    }
    static GetSiblingIndex_Injected(arg0) {
      return window.ctx.call("UnityEngine.Transform", "GetSiblingIndex_Injected", [arg0]).val();
    }
    Internal_LookAt(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "Internal_LookAt", [this.ptr, arg0, arg1]);
    }
    static Internal_LookAt_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "Internal_LookAt_Injected", [arg0, arg1, arg2]);
    }
    InverseTransformDirection_direction(direction) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "InverseTransformDirection_2888", [out, this.ptr, direction]);
        return out;
      })();
    }
    InverseTransformDirection_x_y_z(x, y, z) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "InverseTransformDirection_24456", [out, this.ptr, x, y, z]);
        return out;
      })();
    }
    static InverseTransformDirection_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformDirection_Injected", [arg0, arg1, arg2]);
    }
    InverseTransformDirections_directions_transformedDirections(directions, transformedDirections) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformDirections_24458", [
        this.ptr,
        directions,
        transformedDirections,
      ]);
    }
    InverseTransformDirections_directions(directions) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformDirections_24459", [this.ptr, directions]);
    }
    InverseTransformDirectionsInternal(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformDirectionsInternal", [this.ptr, arg0, arg1]);
    }
    static InverseTransformDirectionsInternal_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformDirectionsInternal_Injected", [arg0, arg1, arg2]);
    }
    InverseTransformPoint_position(position) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "InverseTransformPoint_24475", [out, this.ptr, position]);
        return out;
      })();
    }
    InverseTransformPoint_x_y_z(x, y, z) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "InverseTransformPoint_24476", [out, this.ptr, x, y, z]);
        return out;
      })();
    }
    static InverseTransformPoint_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformPoint_Injected", [arg0, arg1, arg2]);
    }
    InverseTransformPoints_positions_transformedPositions(positions, transformedPositions) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformPoints_24478", [
        this.ptr,
        positions,
        transformedPositions,
      ]);
    }
    InverseTransformPoints_positions(positions) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformPoints_24479", [this.ptr, positions]);
    }
    InverseTransformPointsInternal(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformPointsInternal", [this.ptr, arg0, arg1]);
    }
    static InverseTransformPointsInternal_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformPointsInternal_Injected", [arg0, arg1, arg2]);
    }
    InverseTransformVector_vector(vector) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "InverseTransformVector_24465", [out, this.ptr, vector]);
        return out;
      })();
    }
    InverseTransformVector_x_y_z(x, y, z) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "InverseTransformVector_24466", [out, this.ptr, x, y, z]);
        return out;
      })();
    }
    static InverseTransformVector_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformVector_Injected", [arg0, arg1, arg2]);
    }
    InverseTransformVectors_vectors_transformedVectors(vectors, transformedVectors) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformVectors_24468", [
        this.ptr,
        vectors,
        transformedVectors,
      ]);
    }
    InverseTransformVectors_vectors(vectors) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformVectors_24469", [this.ptr, vectors]);
    }
    InverseTransformVectorsInternal(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformVectorsInternal", [this.ptr, arg0, arg1]);
    }
    static InverseTransformVectorsInternal_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "InverseTransformVectorsInternal_Injected", [arg0, arg1, arg2]);
    }
    IsChildOf(arg0) {
      return window.ctx.call("UnityEngine.Transform", "IsChildOf", [this.ptr, arg0]).val() === 1;
    }
    static IsChildOf_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Transform", "IsChildOf_Injected", [arg0, arg1]).val() === 1;
    }
    IsConstrainProportionsScale() {
      return window.ctx.call("UnityEngine.Transform", "IsConstrainProportionsScale", [this.ptr]).val() === 1;
    }
    static IsConstrainProportionsScale_Injected(arg0) {
      return window.ctx.call("UnityEngine.Transform", "IsConstrainProportionsScale_Injected", [arg0]).val() === 1;
    }
    IsNonUniformScaleTransform() {
      return window.ctx.call("UnityEngine.Transform", "IsNonUniformScaleTransform", [this.ptr]).val() === 1;
    }
    static IsNonUniformScaleTransform_Injected(arg0) {
      return window.ctx.call("UnityEngine.Transform", "IsNonUniformScaleTransform_Injected", [arg0]).val() === 1;
    }
    LookAt_target_worldUp(target, worldUp) {
      window.ctx.call("UnityEngine.Transform", "LookAt_24447", [this.ptr, target, worldUp]);
    }
    LookAt_target(target) {
      window.ctx.call("UnityEngine.Transform", "LookAt_24448", [this.ptr, target]);
    }
    LookAt_worldPosition_worldUp(worldPosition, worldUp) {
      window.ctx.call("UnityEngine.Transform", "LookAt_24449", [this.ptr, worldPosition, worldUp]);
    }
    LookAt_worldPosition(worldPosition) {
      window.ctx.call("UnityEngine.Transform", "LookAt_2812", [this.ptr, worldPosition]);
    }
    MoveAfterSibling(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "MoveAfterSibling", [this.ptr, arg0, arg1]);
    }
    static MoveAfterSibling_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "MoveAfterSibling_Injected", [arg0, arg1, arg2]);
    }
    Rotate_eulers_relativeTo(eulers, relativeTo) {
      window.ctx.call("UnityEngine.Transform", "Rotate_24439", [this.ptr, eulers, relativeTo]);
    }
    Rotate_eulers(eulers) {
      window.ctx.call("UnityEngine.Transform", "Rotate_24440", [this.ptr, eulers]);
    }
    Rotate_xAngle_yAngle_zAngle_relativeTo(xAngle, yAngle, zAngle, relativeTo) {
      window.ctx.call("UnityEngine.Transform", "Rotate_24441", [this.ptr, xAngle, yAngle, zAngle, relativeTo]);
    }
    Rotate_xAngle_yAngle_zAngle(xAngle, yAngle, zAngle) {
      window.ctx.call("UnityEngine.Transform", "Rotate_24442", [this.ptr, xAngle, yAngle, zAngle]);
    }
    Rotate_axis_angle_relativeTo(axis, angle, relativeTo) {
      window.ctx.call("UnityEngine.Transform", "Rotate_24444", [this.ptr, axis, angle, relativeTo]);
    }
    Rotate_axis_angle(axis, angle) {
      window.ctx.call("UnityEngine.Transform", "Rotate_24445", [this.ptr, axis, angle]);
    }
    RotateAround_point_axis_angle(point, axis, angle) {
      window.ctx.call("UnityEngine.Transform", "RotateAround_24446", [this.ptr, point, axis, angle]);
    }
    RotateAround_axis_angle(axis, angle) {
      window.ctx.call("UnityEngine.Transform", "RotateAround_24496", [this.ptr, axis, angle]);
    }
    RotateAroundInternal(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "RotateAroundInternal", [this.ptr, arg0, arg1]);
    }
    static RotateAroundInternal_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "RotateAroundInternal_Injected", [arg0, arg1, arg2]);
    }
    RotateAroundLocal(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "RotateAroundLocal", [this.ptr, arg0, arg1]);
    }
    static RotateAroundLocal_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "RotateAroundLocal_Injected", [arg0, arg1, arg2]);
    }
    static RotateAround_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "RotateAround_Injected", [arg0, arg1, arg2]);
    }
    SendTransformChangedScale() {
      window.ctx.call("UnityEngine.Transform", "SendTransformChangedScale", [this.ptr]);
    }
    static SendTransformChangedScale_Injected(arg0) {
      window.ctx.call("UnityEngine.Transform", "SendTransformChangedScale_Injected", [arg0]);
    }
    SetAsFirstSibling() {
      window.ctx.call("UnityEngine.Transform", "SetAsFirstSibling", [this.ptr]);
    }
    static SetAsFirstSibling_Injected(arg0) {
      window.ctx.call("UnityEngine.Transform", "SetAsFirstSibling_Injected", [arg0]);
    }
    SetAsLastSibling() {
      window.ctx.call("UnityEngine.Transform", "SetAsLastSibling", [this.ptr]);
    }
    static SetAsLastSibling_Injected(arg0) {
      window.ctx.call("UnityEngine.Transform", "SetAsLastSibling_Injected", [arg0]);
    }
    SetConstrainProportionsScale(arg0) {
      window.ctx.call("UnityEngine.Transform", "SetConstrainProportionsScale", [this.ptr, arg0]);
    }
    static SetConstrainProportionsScale_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "SetConstrainProportionsScale_Injected", [arg0, arg1]);
    }
    SetLocalEulerAngles(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "SetLocalEulerAngles", [this.ptr, arg0, arg1]);
    }
    static SetLocalEulerAngles_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "SetLocalEulerAngles_Injected", [arg0, arg1, arg2]);
    }
    SetLocalEulerHint(arg0) {
      window.ctx.call("UnityEngine.Transform", "SetLocalEulerHint", [this.ptr, arg0]);
    }
    static SetLocalEulerHint_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "SetLocalEulerHint_Injected", [arg0, arg1]);
    }
    SetLocalPositionAndRotation(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "SetLocalPositionAndRotation", [this.ptr, arg0, arg1]);
    }
    static SetLocalPositionAndRotation_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "SetLocalPositionAndRotation_Injected", [arg0, arg1, arg2]);
    }
    SetParent_p(p) {
      window.ctx.call("UnityEngine.Transform", "SetParent_2545", [this.ptr, p]);
    }
    SetParent_parent_worldPositionStays(parent, worldPositionStays) {
      window.ctx.call("UnityEngine.Transform", "SetParent_24428", [this.ptr, parent, worldPositionStays]);
    }
    static SetParent_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "SetParent_Injected", [arg0, arg1, arg2]);
    }
    SetPositionAndRotation(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "SetPositionAndRotation", [this.ptr, arg0, arg1]);
    }
    static SetPositionAndRotation_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "SetPositionAndRotation_Injected", [arg0, arg1, arg2]);
    }
    SetRotationOrderInternal(arg0) {
      window.ctx.call("UnityEngine.Transform", "SetRotationOrderInternal", [this.ptr, arg0]);
    }
    static SetRotationOrderInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "SetRotationOrderInternal_Injected", [arg0, arg1]);
    }
    SetSiblingIndex(arg0) {
      window.ctx.call("UnityEngine.Transform", "SetSiblingIndex", [this.ptr, arg0]);
    }
    static SetSiblingIndex_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "SetSiblingIndex_Injected", [arg0, arg1]);
    }
    TransformDirection_direction(direction) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "TransformDirection_24451", [out, this.ptr, direction]);
        return out;
      })();
    }
    TransformDirection_x_y_z(x, y, z) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "TransformDirection_24452", [out, this.ptr, x, y, z]);
        return out;
      })();
    }
    static TransformDirection_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "TransformDirection_Injected", [arg0, arg1, arg2]);
    }
    TransformDirections_directions_transformedDirections(directions, transformedDirections) {
      window.ctx.call("UnityEngine.Transform", "TransformDirections_24454", [
        this.ptr,
        directions,
        transformedDirections,
      ]);
    }
    TransformDirections_directions(directions) {
      window.ctx.call("UnityEngine.Transform", "TransformDirections_24455", [this.ptr, directions]);
    }
    TransformDirectionsInternal(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "TransformDirectionsInternal", [this.ptr, arg0, arg1]);
    }
    static TransformDirectionsInternal_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "TransformDirectionsInternal_Injected", [arg0, arg1, arg2]);
    }
    TransformPoint_position(position) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "TransformPoint_24470", [out, this.ptr, position]);
        return out;
      })();
    }
    TransformPoint_x_y_z(x, y, z) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "TransformPoint_24471", [out, this.ptr, x, y, z]);
        return out;
      })();
    }
    static TransformPoint_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "TransformPoint_Injected", [arg0, arg1, arg2]);
    }
    TransformPoints_positions_transformedPositions(positions, transformedPositions) {
      window.ctx.call("UnityEngine.Transform", "TransformPoints_24473", [this.ptr, positions, transformedPositions]);
    }
    TransformPoints_positions(positions) {
      window.ctx.call("UnityEngine.Transform", "TransformPoints_24474", [this.ptr, positions]);
    }
    TransformPointsInternal(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "TransformPointsInternal", [this.ptr, arg0, arg1]);
    }
    static TransformPointsInternal_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "TransformPointsInternal_Injected", [arg0, arg1, arg2]);
    }
    TransformVector_vector(vector) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "TransformVector_24460", [out, this.ptr, vector]);
        return out;
      })();
    }
    TransformVector_x_y_z(x, y, z) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Transform", "TransformVector_24461", [out, this.ptr, x, y, z]);
        return out;
      })();
    }
    static TransformVector_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "TransformVector_Injected", [arg0, arg1, arg2]);
    }
    TransformVectors_vectors_transformedVectors(vectors, transformedVectors) {
      window.ctx.call("UnityEngine.Transform", "TransformVectors_24463", [this.ptr, vectors, transformedVectors]);
    }
    TransformVectors_vectors(vectors) {
      window.ctx.call("UnityEngine.Transform", "TransformVectors_24464", [this.ptr, vectors]);
    }
    TransformVectorsInternal(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "TransformVectorsInternal", [this.ptr, arg0, arg1]);
    }
    static TransformVectorsInternal_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Transform", "TransformVectorsInternal_Injected", [arg0, arg1, arg2]);
    }
    Translate_translation_relativeTo(translation, relativeTo) {
      window.ctx.call("UnityEngine.Transform", "Translate_24433", [this.ptr, translation, relativeTo]);
    }
    Translate_translation(translation) {
      window.ctx.call("UnityEngine.Transform", "Translate_24434", [this.ptr, translation]);
    }
    Translate_x_y_z_relativeTo(x, y, z, relativeTo) {
      window.ctx.call("UnityEngine.Transform", "Translate_24435", [this.ptr, x, y, z, relativeTo]);
    }
    Translate_x_y_z(x, y, z) {
      window.ctx.call("UnityEngine.Transform", "Translate_24436", [this.ptr, x, y, z]);
    }
    Translate_translation_relativeTo(translation, relativeTo) {
      window.ctx.call("UnityEngine.Transform", "Translate_24437", [this.ptr, translation, relativeTo]);
    }
    Translate_x_y_z_relativeTo(x, y, z, relativeTo) {
      window.ctx.call("UnityEngine.Transform", "Translate_24438", [this.ptr, x, y, z, relativeTo]);
    }
    static get_childCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Transform", "get_childCount_Injected", [arg0]).val();
    }
    static get_hasChanged_Injected(arg0) {
      return window.ctx.call("UnityEngine.Transform", "get_hasChanged_Injected", [arg0]).val() === 1;
    }
    static get_localPosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "get_localPosition_Injected", [arg0, arg1]);
    }
    static get_localRotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "get_localRotation_Injected", [arg0, arg1]);
    }
    static get_localScale_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "get_localScale_Injected", [arg0, arg1]);
    }
    static get_localToWorldMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "get_localToWorldMatrix_Injected", [arg0, arg1]);
    }
    static get_lossyScale_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "get_lossyScale_Injected", [arg0, arg1]);
    }
    static get_position_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "get_position_Injected", [arg0, arg1]);
    }
    static get_rotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "get_rotation_Injected", [arg0, arg1]);
    }
    static get_worldToLocalMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "get_worldToLocalMatrix_Injected", [arg0, arg1]);
    }
    internal_getHierarchyCapacity() {
      return window.ctx.call("UnityEngine.Transform", "internal_getHierarchyCapacity", [this.ptr]).val();
    }
    static internal_getHierarchyCapacity_Injected(arg0) {
      return window.ctx.call("UnityEngine.Transform", "internal_getHierarchyCapacity_Injected", [arg0]).val();
    }
    internal_getHierarchyCount() {
      return window.ctx.call("UnityEngine.Transform", "internal_getHierarchyCount", [this.ptr]).val();
    }
    static internal_getHierarchyCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Transform", "internal_getHierarchyCount_Injected", [arg0]).val();
    }
    internal_setHierarchyCapacity(setHierarchyCapacity) {
      window.ctx.call("UnityEngine.Transform", "internal_setHierarchyCapacity", [this.ptr, setHierarchyCapacity]);
    }
    static internal_setHierarchyCapacity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "internal_setHierarchyCapacity_Injected", [arg0, arg1]);
    }
    static set_hasChanged_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "set_hasChanged_Injected", [arg0, arg1]);
    }
    static set_localPosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "set_localPosition_Injected", [arg0, arg1]);
    }
    static set_localRotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "set_localRotation_Injected", [arg0, arg1]);
    }
    static set_localScale_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "set_localScale_Injected", [arg0, arg1]);
    }
    static set_position_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "set_position_Injected", [arg0, arg1]);
    }
    static set_rotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Transform", "set_rotation_Injected", [arg0, arg1]);
    }
  }
  class NetworkManager {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    static get CurrentLobby() {
      return window.ctx.call("NetworkManager", "get_CurrentLobby", []);
    }
    static set CurrentLobby(value) {
      window.ctx.call("NetworkManager", "set_CurrentLobby", [value]);
    }
    static get CurrentRoom() {
      return window.ctx.call("NetworkManager", "get_CurrentRoom", []);
    }
    static set CurrentRoom(value) {
      window.ctx.call("NetworkManager", "set_CurrentRoom", [value]);
    }
    static get InLobby() {
      return window.ctx.call("NetworkManager", "get_InLobby", []).val() === 1;
    }
    static get InRoom() {
      return window.ctx.call("NetworkManager", "get_InRoom", []).val() === 1;
    }
    static get InTraining() {
      return window.ctx.call("NetworkManager", "get_InTraining", []).val() === 1;
    }
    static get IsConnected() {
      return window.ctx.call("NetworkManager", "get_IsConnected", []).val() === 1;
    }
    static get MyActorNumber() {
      return window.ctx.call("NetworkManager", "get_MyActorNumber", []).val();
    }
    static get MyPlayerID() {
      return window.ctx.call("NetworkManager", "get_MyPlayerID", []);
    }
    get NickName() {
      return window.ctx.call("NetworkManager", "get_NickName", [this.ptr]);
    }
    static get OfflineMode() {
      return window.ctx.call("NetworkManager", "get_OfflineMode", []).val() === 1;
    }
    get OnClientChanged() {
      return this.ptr.readField(20, "i32");
    }
    set OnClientChanged(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get OnRoomChanged() {
      return this.ptr.readField(12, "i32");
    }
    set OnRoomChanged(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get canCancelPlay() {
      return this.ptr.readField(17, "i32").val() === 1;
    }
    set canCancelPlay(value) {
      return this.ptr.writeField(17, "i32", value);
    }
    get cancelPlay() {
      return this.ptr.readField(16, "i32").val() === 1;
    }
    set cancelPlay(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get client() {
      return new ColyseusClient(this.ptr.readField(20, "i32"));
    }
    set client(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get clientInitialized() {
      return this.ptr.readField(16, "i32").val() === 1;
    }
    set clientInitialized(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get currentLobbyRoom() {
      return this.ptr.readField(8, "i32");
    }
    set currentLobbyRoom(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    get currentRoom() {
      return this.ptr.readField(4, "i32");
    }
    set currentRoom(value) {
      return this.ptr.writeField(4, "i32", value);
    }
    get instance() {
      return new NetworkManager(this.ptr.readField(0, "i32"));
    }
    set instance(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get isConnected() {
      return this.ptr.readField(28, "i32").val() === 1;
    }
    set isConnected(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get isMatchmaking() {
      return this.ptr.readField(29, "i32").val() === 1;
    }
    set isMatchmaking(value) {
      return this.ptr.writeField(29, "i32", value);
    }
    get nickname() {
      return this.ptr.readField(24, "i32").mstr();
    }
    set nickname(value) {
      return this.ptr.writeField(24, "i32", window.ctx.createMstr(value));
    }
    static ActorNumberOf(arg0) {
      return window.ctx.call("NetworkManager", "ActorNumberOf", [arg0]).val();
    }
    Awake() {
      window.ctx.call("NetworkManager", "Awake", [this.ptr]);
    }
    CancelPlay() {
      return window.ctx.call("NetworkManager", "CancelPlay", [this.ptr]);
    }
    static ConvertToDictionaryString(arg0) {
      return window.ctx.call("NetworkManager", "ConvertToDictionaryString", [arg0]);
    }
    CreateCustom(arg0, arg1, arg2) {
      window.ctx.call("NetworkManager", "CreateCustom", [this.ptr, arg0, arg1, arg2]);
    }
    CreateRoomOnServer(arg0, arg1, arg2) {
      return window.ctx.call("NetworkManager", "CreateRoomOnServer", [this.ptr, arg0, arg1, arg2]);
    }
    Disconnect() {
      window.ctx.call("NetworkManager", "Disconnect", [this.ptr]);
    }
    FindLobbyReservationOnServer(arg0, arg1, arg2) {
      return window.ctx.call("NetworkManager", "FindLobbyReservationOnServer", [this.ptr, arg0, arg1, arg2]);
    }
    FindRoomOnServer(arg0, arg1, arg2, arg3, arg4) {
      return window.ctx.call("NetworkManager", "FindRoomOnServer", [this.ptr, arg0, arg1, arg2, arg3, arg4]);
    }
    static GetBaseUrl(arg0) {
      return window.ctx.call("NetworkManager", "GetBaseUrl", [arg0]);
    }
    static GetClient() {
      return new ColyseusClient(window.ctx.call("NetworkManager", "GetClient", []));
    }
    static GetIsMatchmaking() {
      return window.ctx.call("NetworkManager", "GetIsMatchmaking", []).val() === 1;
    }
    GetOptionsForRoom() {
      return window.ctx.call("NetworkManager", "GetOptionsForRoom", [this.ptr]);
    }
    GetRoomCloseErrorInfo(arg0) {
      return window.ctx.call("NetworkManager", "GetRoomCloseErrorInfo", [this.ptr, arg0]);
    }
    InitializeClient() {
      return window.ctx.call("NetworkManager", "InitializeClient", [this.ptr]);
    }
    IsReadyToEnterMap(arg0, arg1, arg2) {
      return window.ctx.call("NetworkManager", "IsReadyToEnterMap", [this.ptr, arg0, arg1, arg2]).val() === 1;
    }
    static IsRoomValidToJoinPreflight(arg0) {
      return window.ctx.call("NetworkManager", "IsRoomValidToJoinPreflight", [arg0]);
    }
    JoinFromReservation(arg0, arg1, arg2, arg3) {
      window.ctx.call("NetworkManager", "JoinFromReservation", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    JoinRoomByIdOnServer(arg0) {
      return window.ctx.call("NetworkManager", "JoinRoomByIdOnServer", [this.ptr, arg0]);
    }
    JoinRoomForce(arg0, arg1, arg2, arg3) {
      window.ctx.call("NetworkManager", "JoinRoomForce", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    static ListenToCurrentRoomOrLobby(arg0, arg1, arg2, arg3) {
      return window.ctx.call("NetworkManager", "ListenToCurrentRoomOrLobby", [arg0, arg1, arg2, arg3]);
    }
    static NickNameOf(arg0) {
      return window.ctx.call("NetworkManager", "NickNameOf", [arg0]);
    }
    OnApplicationQuit() {
      window.ctx.call("NetworkManager", "OnApplicationQuit", [this.ptr]);
    }
    OnDestroy() {
      window.ctx.call("NetworkManager", "OnDestroy", [this.ptr]);
    }
    Play(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("NetworkManager", "Play", [this.ptr, arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    PlayOffline(arg0, arg1, arg2, arg3) {
      window.ctx.call("NetworkManager", "PlayOffline", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    static SendToCurrentRoomOrLobby(arg0, arg1, arg2) {
      return window.ctx.call("NetworkManager", "SendToCurrentRoomOrLobby", [arg0, arg1, arg2]);
    }
    static SerializeValue(arg0) {
      return new JSONNode(window.ctx.call("NetworkManager", "SerializeValue", [arg0]));
    }
    SetNickname(arg0) {
      window.ctx.call("NetworkManager", "SetNickname", [this.ptr, arg0]);
    }
    Start() {
      window.ctx.call("NetworkManager", "Start", [this.ptr]);
    }
    static ToJSON(arg0) {
      return window.ctx.call("NetworkManager", "ToJSON", [arg0]);
    }
    static TryGetMyPlayer(arg0) {
      return window.ctx.call("NetworkManager", "TryGetMyPlayer", [arg0]).val() === 1;
    }
    static TryGetPlayer(arg0, arg1) {
      return window.ctx.call("NetworkManager", "TryGetPlayer", [arg0, arg1]).val() === 1;
    }
    WaitForFrames(arg0) {
      return window.ctx.call("NetworkManager", "WaitForFrames", [this.ptr, arg0]);
    }
  }
  class Matchmake3DBox {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get aboutToStartDuration() {
      return this.ptr.readField(60, "f32").val();
    }
    set aboutToStartDuration(value) {
      return this.ptr.writeField(60, "f32", value);
    }
    get box() {
      return new Matchmake3DBoxState(this.ptr.readField(76, "i32"));
    }
    set box(value) {
      return this.ptr.writeField(76, "i32", value);
    }
    get index() {
      return this.ptr.readField(68, "i32").val();
    }
    set index(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get lastIntTimeLeftForStart() {
      return this.ptr.readField(64, "i32").val();
    }
    set lastIntTimeLeftForStart(value) {
      return this.ptr.writeField(64, "i32", value);
    }
    get localInQueue() {
      return this.ptr.readField(104, "i32").val() === 1;
    }
    set localInQueue(value) {
      return this.ptr.writeField(104, "i32", value);
    }
    get room() {
      return this.ptr.readField(72, "i32");
    }
    set room(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get team0CountText() {
      return this.ptr.readField(20, "i32");
    }
    set team0CountText(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get team0Objects() {
      return JSArray(this.ptr.readField(36, "i32"));
    }
    set team0Objects(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get team0PfpFrames() {
      return JSArray(this.ptr.readField(40, "i32"));
    }
    set team0PfpFrames(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get team0PlayerNames() {
      return JSArray(this.ptr.readField(44, "i32"));
    }
    set team0PlayerNames(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get team0rotatingCircle() {
      return new Transform(this.ptr.readField(28, "i32"));
    }
    set team0rotatingCircle(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get team1CountText() {
      return this.ptr.readField(24, "i32");
    }
    set team1CountText(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get team1Objects() {
      return JSArray(this.ptr.readField(48, "i32"));
    }
    set team1Objects(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    get team1PfpFrames() {
      return JSArray(this.ptr.readField(52, "i32"));
    }
    set team1PfpFrames(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get team1PlayerNames() {
      return JSArray(this.ptr.readField(56, "i32"));
    }
    set team1PlayerNames(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get team1rotatingCircle() {
      return new Transform(this.ptr.readField(32, "i32"));
    }
    set team1rotatingCircle(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get timerCounterText() {
      return this.ptr.readField(16, "i32");
    }
    set timerCounterText(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get unregisterT0Add() {
      return this.ptr.readField(80, "i32");
    }
    set unregisterT0Add(value) {
      return this.ptr.writeField(80, "i32", value);
    }
    get unregisterT0Change() {
      return this.ptr.readField(88, "i32");
    }
    set unregisterT0Change(value) {
      return this.ptr.writeField(88, "i32", value);
    }
    get unregisterT0Remove() {
      return this.ptr.readField(84, "i32");
    }
    set unregisterT0Remove(value) {
      return this.ptr.writeField(84, "i32", value);
    }
    get unregisterT1Add() {
      return this.ptr.readField(92, "i32");
    }
    set unregisterT1Add(value) {
      return this.ptr.writeField(92, "i32", value);
    }
    get unregisterT1Change() {
      return this.ptr.readField(100, "i32");
    }
    set unregisterT1Change(value) {
      return this.ptr.writeField(100, "i32", value);
    }
    get unregisterT1Remove() {
      return this.ptr.readField(96, "i32");
    }
    set unregisterT1Remove(value) {
      return this.ptr.writeField(96, "i32", value);
    }
    _SubscribeBox_b_32_1(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "<SubscribeBox>b__32_1", [this.ptr, arg0, arg1]);
    }
    _SubscribeBox_b_32_11(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "<SubscribeBox>b__32_11", [this.ptr, arg0, arg1]);
    }
    _SubscribeBox_b_32_3(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "<SubscribeBox>b__32_3", [this.ptr, arg0, arg1]);
    }
    _SubscribeBox_b_32_5(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "<SubscribeBox>b__32_5", [this.ptr, arg0, arg1]);
    }
    _SubscribeBox_b_32_7(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "<SubscribeBox>b__32_7", [this.ptr, arg0, arg1]);
    }
    _SubscribeBox_b_32_9(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "<SubscribeBox>b__32_9", [this.ptr, arg0, arg1]);
    }
    AnimateTimeLeftForStart(arg0) {
      window.ctx.call("Matchmake3DBox", "AnimateTimeLeftForStart", [this.ptr, arg0]);
    }
    Awake() {
      window.ctx.call("Matchmake3DBox", "Awake", [this.ptr]);
    }
    DebouncedRefreshAllSlots() {
      window.ctx.call("Matchmake3DBox", "DebouncedRefreshAllSlots", [this.ptr]);
    }
    GetMaxPlayersPerTeam(arg0) {
      return window.ctx.call("Matchmake3DBox", "GetMaxPlayersPerTeam", [this.ptr, arg0]).val();
    }
    HandleJoinedLobby() {
      window.ctx.call("Matchmake3DBox", "HandleJoinedLobby", [this.ptr]);
    }
    HandleLeftLobby(arg0) {
      window.ctx.call("Matchmake3DBox", "HandleLeftLobby", [this.ptr, arg0]);
    }
    OnDisable() {
      window.ctx.call("Matchmake3DBox", "OnDisable", [this.ptr]);
    }
    OnEnable() {
      window.ctx.call("Matchmake3DBox", "OnEnable", [this.ptr]);
    }
    OnTeam0Add(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "OnTeam0Add", [this.ptr, arg0, arg1]);
    }
    OnTeam0Change(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "OnTeam0Change", [this.ptr, arg0, arg1]);
    }
    OnTeam0Remove(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "OnTeam0Remove", [this.ptr, arg0, arg1]);
    }
    OnTeam1Add(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "OnTeam1Add", [this.ptr, arg0, arg1]);
    }
    OnTeam1Change(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "OnTeam1Change", [this.ptr, arg0, arg1]);
    }
    OnTeam1Remove(arg0, arg1) {
      window.ctx.call("Matchmake3DBox", "OnTeam1Remove", [this.ptr, arg0, arg1]);
    }
    QueueForTeam(arg0) {
      window.ctx.call("Matchmake3DBox", "QueueForTeam", [this.ptr, arg0]);
    }
    RefreshAllSlots() {
      window.ctx.call("Matchmake3DBox", "RefreshAllSlots", [this.ptr]);
    }
    SubscribeBox(arg0) {
      window.ctx.call("Matchmake3DBox", "SubscribeBox", [this.ptr, arg0]);
    }
    TryGetPlayer(arg0, arg1) {
      return window.ctx.call("Matchmake3DBox", "TryGetPlayer", [this.ptr, arg0, arg1]).val() === 1;
    }
    UnqueueCurrent() {
      window.ctx.call("Matchmake3DBox", "UnqueueCurrent", [this.ptr]);
    }
    UnsubscribeBox() {
      window.ctx.call("Matchmake3DBox", "UnsubscribeBox", [this.ptr]);
    }
    Update() {
      window.ctx.call("Matchmake3DBox", "Update", [this.ptr]);
    }
  }
  class Horn {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get boostDuration() {
      return this.ptr.readField(372, "f32").val();
    }
    set boostDuration(value) {
      return this.ptr.writeField(372, "f32", value);
    }
    get boostMultiplier() {
      return this.ptr.readField(368, "f32").val();
    }
    set boostMultiplier(value) {
      return this.ptr.writeField(368, "f32", value);
    }
    CanShoot(arg0, arg1) {
      return window.ctx.call("Horn", "CanShoot", [this.ptr, arg0, arg1]).val() === 1;
    }
    DelayedApplyTemporalBoost() {
      return window.ctx.call("Horn", "DelayedApplyTemporalBoost", [this.ptr]);
    }
    GetTimeToNextRightClickAttack() {
      return window.ctx.call("Horn", "GetTimeToNextRightClickAttack", [this.ptr]).val();
    }
    IsRaycastShooting() {
      return window.ctx.call("Horn", "IsRaycastShooting", [this.ptr]).val() === 1;
    }
    Shoot(arg0, arg1, arg2, arg3) {
      window.ctx.call("Horn", "Shoot", [this.ptr, arg0, arg1, arg2, arg3]);
    }
  }
  class Camera {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get activeTexture() {
      return new RenderTexture(window.ctx.call("UnityEngine.Camera", "get_activeTexture", [this.ptr]));
    }
    get actualRenderingPath() {
      return new RenderingPath(window.ctx.call("UnityEngine.Camera", "get_actualRenderingPath", [this.ptr]));
    }
    static get allCameras() {
      return window.ctx.call("UnityEngine.Camera", "get_allCameras", []);
    }
    static get allCamerasCount() {
      return window.ctx.call("UnityEngine.Camera", "get_allCamerasCount", []).val();
    }
    get allowDynamicResolution() {
      return window.ctx.call("UnityEngine.Camera", "get_allowDynamicResolution", [this.ptr]).val() === 1;
    }
    set allowDynamicResolution(value) {
      window.ctx.call("UnityEngine.Camera", "set_allowDynamicResolution", [this.ptr, value]);
    }
    get allowHDR() {
      return window.ctx.call("UnityEngine.Camera", "get_allowHDR", [this.ptr]).val() === 1;
    }
    set allowHDR(value) {
      window.ctx.call("UnityEngine.Camera", "set_allowHDR", [this.ptr, value]);
    }
    get allowMSAA() {
      return window.ctx.call("UnityEngine.Camera", "get_allowMSAA", [this.ptr]).val() === 1;
    }
    set allowMSAA(value) {
      window.ctx.call("UnityEngine.Camera", "set_allowMSAA", [this.ptr, value]);
    }
    get anamorphism() {
      return window.ctx.call("UnityEngine.Camera", "get_anamorphism", [this.ptr]).val();
    }
    set anamorphism(value) {
      window.ctx.call("UnityEngine.Camera", "set_anamorphism", [this.ptr, value]);
    }
    get aperture() {
      return window.ctx.call("UnityEngine.Camera", "get_aperture", [this.ptr]).val();
    }
    set aperture(value) {
      window.ctx.call("UnityEngine.Camera", "set_aperture", [this.ptr, value]);
    }
    get areVRStereoViewMatricesWithinSingleCullTolerance() {
      return (
        window.ctx
          .call("UnityEngine.Camera", "get_areVRStereoViewMatricesWithinSingleCullTolerance", [this.ptr])
          .val() === 1
      );
    }
    get aspect() {
      return window.ctx.call("UnityEngine.Camera", "get_aspect", [this.ptr]).val();
    }
    set aspect(value) {
      window.ctx.call("UnityEngine.Camera", "set_aspect", [this.ptr, value]);
    }
    get backgroundColor() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Camera", "get_backgroundColor", [out, this.ptr]);
        return out;
      })();
    }
    set backgroundColor(value) {
      window.ctx.call("UnityEngine.Camera", "set_backgroundColor", [this.ptr, value]);
    }
    get barrelClipping() {
      return window.ctx.call("UnityEngine.Camera", "get_barrelClipping", [this.ptr]).val();
    }
    set barrelClipping(value) {
      window.ctx.call("UnityEngine.Camera", "set_barrelClipping", [this.ptr, value]);
    }
    get bladeCount() {
      return window.ctx.call("UnityEngine.Camera", "get_bladeCount", [this.ptr]).val();
    }
    set bladeCount(value) {
      window.ctx.call("UnityEngine.Camera", "set_bladeCount", [this.ptr, value]);
    }
    get cameraToWorldMatrix() {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Camera", "get_cameraToWorldMatrix", [out, this.ptr]);
        return out;
      })();
    }
    get cameraType() {
      return new CameraType(window.ctx.call("UnityEngine.Camera", "get_cameraType", [this.ptr]));
    }
    set cameraType(value) {
      window.ctx.call("UnityEngine.Camera", "set_cameraType", [this.ptr, value]);
    }
    get clearFlags() {
      return new CameraClearFlags(window.ctx.call("UnityEngine.Camera", "get_clearFlags", [this.ptr]));
    }
    set clearFlags(value) {
      window.ctx.call("UnityEngine.Camera", "set_clearFlags", [this.ptr, value]);
    }
    get clearStencilAfterLightingPass() {
      return window.ctx.call("UnityEngine.Camera", "get_clearStencilAfterLightingPass", [this.ptr]).val() === 1;
    }
    set clearStencilAfterLightingPass(value) {
      window.ctx.call("UnityEngine.Camera", "set_clearStencilAfterLightingPass", [this.ptr, value]);
    }
    get commandBufferCount() {
      return window.ctx.call("UnityEngine.Camera", "get_commandBufferCount", [this.ptr]).val();
    }
    get cullingMask() {
      return window.ctx.call("UnityEngine.Camera", "get_cullingMask", [this.ptr]).val();
    }
    set cullingMask(value) {
      window.ctx.call("UnityEngine.Camera", "set_cullingMask", [this.ptr, value]);
    }
    get cullingMatrix() {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Camera", "get_cullingMatrix", [out, this.ptr]);
        return out;
      })();
    }
    set cullingMatrix(value) {
      window.ctx.call("UnityEngine.Camera", "set_cullingMatrix", [this.ptr, value]);
    }
    static get current() {
      return new Camera(window.ctx.call("UnityEngine.Camera", "get_current", []));
    }
    static get currentInternal() {
      return new Camera(window.ctx.call("UnityEngine.Camera", "get_currentInternal", []));
    }
    get curvature() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Camera", "get_curvature", [out, this.ptr]);
        return out;
      })();
    }
    set curvature(value) {
      window.ctx.call("UnityEngine.Camera", "set_curvature", [this.ptr, value]);
    }
    get depth() {
      return window.ctx.call("UnityEngine.Camera", "get_depth", [this.ptr]).val();
    }
    set depth(value) {
      window.ctx.call("UnityEngine.Camera", "set_depth", [this.ptr, value]);
    }
    get depthTextureMode() {
      return new DepthTextureMode(window.ctx.call("UnityEngine.Camera", "get_depthTextureMode", [this.ptr]));
    }
    set depthTextureMode(value) {
      window.ctx.call("UnityEngine.Camera", "set_depthTextureMode", [this.ptr, value]);
    }
    get eventMask() {
      return window.ctx.call("UnityEngine.Camera", "get_eventMask", [this.ptr]).val();
    }
    set eventMask(value) {
      window.ctx.call("UnityEngine.Camera", "set_eventMask", [this.ptr, value]);
    }
    get farClipPlane() {
      return window.ctx.call("UnityEngine.Camera", "get_farClipPlane", [this.ptr]).val();
    }
    set farClipPlane(value) {
      window.ctx.call("UnityEngine.Camera", "set_farClipPlane", [this.ptr, value]);
    }
    get fieldOfView() {
      return window.ctx.call("UnityEngine.Camera", "get_fieldOfView", [this.ptr]).val();
    }
    set fieldOfView(value) {
      window.ctx.call("UnityEngine.Camera", "set_fieldOfView", [this.ptr, value]);
    }
    get focalLength() {
      return window.ctx.call("UnityEngine.Camera", "get_focalLength", [this.ptr]).val();
    }
    set focalLength(value) {
      window.ctx.call("UnityEngine.Camera", "set_focalLength", [this.ptr, value]);
    }
    get focusDistance() {
      return window.ctx.call("UnityEngine.Camera", "get_focusDistance", [this.ptr]).val();
    }
    set focusDistance(value) {
      window.ctx.call("UnityEngine.Camera", "set_focusDistance", [this.ptr, value]);
    }
    get forceIntoRenderTexture() {
      return window.ctx.call("UnityEngine.Camera", "get_forceIntoRenderTexture", [this.ptr]).val() === 1;
    }
    set forceIntoRenderTexture(value) {
      window.ctx.call("UnityEngine.Camera", "set_forceIntoRenderTexture", [this.ptr, value]);
    }
    get gateFit() {
      return window.ctx.call("UnityEngine.Camera", "get_gateFit", [this.ptr]);
    }
    set gateFit(value) {
      window.ctx.call("UnityEngine.Camera", "set_gateFit", [this.ptr, value]);
    }
    get iso() {
      return window.ctx.call("UnityEngine.Camera", "get_iso", [this.ptr]).val();
    }
    set iso(value) {
      window.ctx.call("UnityEngine.Camera", "set_iso", [this.ptr, value]);
    }
    get isProcessingRenderRequest() {
      return window.ctx.call("UnityEngine.Camera", "get_isProcessingRenderRequest", [this.ptr]).val() === 1;
    }
    get layerCullDistances() {
      return window.ctx.call("UnityEngine.Camera", "get_layerCullDistances", [this.ptr]);
    }
    set layerCullDistances(value) {
      window.ctx.call("UnityEngine.Camera", "set_layerCullDistances", [this.ptr, value]);
    }
    get layerCullSpherical() {
      return window.ctx.call("UnityEngine.Camera", "get_layerCullSpherical", [this.ptr]).val() === 1;
    }
    set layerCullSpherical(value) {
      window.ctx.call("UnityEngine.Camera", "set_layerCullSpherical", [this.ptr, value]);
    }
    get layerCullSphericalInternal() {
      return window.ctx.call("UnityEngine.Camera", "get_layerCullSphericalInternal", [this.ptr]).val() === 1;
    }
    set layerCullSphericalInternal(value) {
      window.ctx.call("UnityEngine.Camera", "set_layerCullSphericalInternal", [this.ptr, value]);
    }
    get lensShift() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Camera", "get_lensShift", [out, this.ptr]);
        return out;
      })();
    }
    set lensShift(value) {
      window.ctx.call("UnityEngine.Camera", "set_lensShift", [this.ptr, value]);
    }
    static get main() {
      return new Camera(window.ctx.call("UnityEngine.Camera", "get_main", []));
    }
    get nearClipPlane() {
      return window.ctx.call("UnityEngine.Camera", "get_nearClipPlane", [this.ptr]).val();
    }
    set nearClipPlane(value) {
      window.ctx.call("UnityEngine.Camera", "set_nearClipPlane", [this.ptr, value]);
    }
    get nonJitteredProjectionMatrix() {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Camera", "get_nonJitteredProjectionMatrix", [out, this.ptr]);
        return out;
      })();
    }
    set nonJitteredProjectionMatrix(value) {
      window.ctx.call("UnityEngine.Camera", "set_nonJitteredProjectionMatrix", [this.ptr, value]);
    }
    get opaqueSortMode() {
      return new OpaqueSortMode(window.ctx.call("UnityEngine.Camera", "get_opaqueSortMode", [this.ptr]));
    }
    set opaqueSortMode(value) {
      window.ctx.call("UnityEngine.Camera", "set_opaqueSortMode", [this.ptr, value]);
    }
    get orthographic() {
      return window.ctx.call("UnityEngine.Camera", "get_orthographic", [this.ptr]).val() === 1;
    }
    set orthographic(value) {
      window.ctx.call("UnityEngine.Camera", "set_orthographic", [this.ptr, value]);
    }
    get orthographicSize() {
      return window.ctx.call("UnityEngine.Camera", "get_orthographicSize", [this.ptr]).val();
    }
    set orthographicSize(value) {
      window.ctx.call("UnityEngine.Camera", "set_orthographicSize", [this.ptr, value]);
    }
    get overrideSceneCullingMask() {
      return window.ctx.call("UnityEngine.Camera", "get_overrideSceneCullingMask", [this.ptr]).val();
    }
    set overrideSceneCullingMask(value) {
      window.ctx.call("UnityEngine.Camera", "set_overrideSceneCullingMask", [this.ptr, value]);
    }
    get pixelHeight() {
      return window.ctx.call("UnityEngine.Camera", "get_pixelHeight", [this.ptr]).val();
    }
    get pixelRect() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "get_pixelRect", [out, this.ptr]);
        return out;
      })();
    }
    set pixelRect(value) {
      window.ctx.call("UnityEngine.Camera", "set_pixelRect", [this.ptr, value]);
    }
    get pixelWidth() {
      return window.ctx.call("UnityEngine.Camera", "get_pixelWidth", [this.ptr]).val();
    }
    static get PreviewCullingLayer() {
      return window.ctx.call("UnityEngine.Camera", "get_PreviewCullingLayer", []).val();
    }
    get previousViewProjectionMatrix() {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Camera", "get_previousViewProjectionMatrix", [out, this.ptr]);
        return out;
      })();
    }
    get projectionMatrix() {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Camera", "get_projectionMatrix", [out, this.ptr]);
        return out;
      })();
    }
    set projectionMatrix(value) {
      window.ctx.call("UnityEngine.Camera", "set_projectionMatrix", [this.ptr, value]);
    }
    get projectionMatrixMode() {
      return window.ctx.call("UnityEngine.Camera", "get_projectionMatrixMode", [this.ptr]);
    }
    get rect() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "get_rect", [out, this.ptr]);
        return out;
      })();
    }
    set rect(value) {
      window.ctx.call("UnityEngine.Camera", "set_rect", [this.ptr, value]);
    }
    get renderCloudsInSceneView() {
      return window.ctx.call("UnityEngine.Camera", "get_renderCloudsInSceneView", [this.ptr]).val() === 1;
    }
    set renderCloudsInSceneView(value) {
      window.ctx.call("UnityEngine.Camera", "set_renderCloudsInSceneView", [this.ptr, value]);
    }
    get renderingPath() {
      return new RenderingPath(window.ctx.call("UnityEngine.Camera", "get_renderingPath", [this.ptr]));
    }
    set renderingPath(value) {
      window.ctx.call("UnityEngine.Camera", "set_renderingPath", [this.ptr, value]);
    }
    get scaledPixelHeight() {
      return window.ctx.call("UnityEngine.Camera", "get_scaledPixelHeight", [this.ptr]).val();
    }
    get scaledPixelWidth() {
      return window.ctx.call("UnityEngine.Camera", "get_scaledPixelWidth", [this.ptr]).val();
    }
    get scene() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "get_scene", [out, this.ptr]);
        return out;
      })();
    }
    set scene(value) {
      window.ctx.call("UnityEngine.Camera", "set_scene", [this.ptr, value]);
    }
    get sceneCullingMask() {
      return window.ctx.call("UnityEngine.Camera", "get_sceneCullingMask", [this.ptr]).val();
    }
    get sceneViewFilterMode() {
      return window.ctx.call("UnityEngine.Camera", "get_sceneViewFilterMode", [this.ptr]);
    }
    get sensorSize() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Camera", "get_sensorSize", [out, this.ptr]);
        return out;
      })();
    }
    set sensorSize(value) {
      window.ctx.call("UnityEngine.Camera", "set_sensorSize", [this.ptr, value]);
    }
    get shutterSpeed() {
      return window.ctx.call("UnityEngine.Camera", "get_shutterSpeed", [this.ptr]).val();
    }
    set shutterSpeed(value) {
      window.ctx.call("UnityEngine.Camera", "set_shutterSpeed", [this.ptr, value]);
    }
    get skyboxMaterial() {
      return new Material(window.ctx.call("UnityEngine.Camera", "get_skyboxMaterial", [this.ptr]));
    }
    get stereoActiveEye() {
      return window.ctx.call("UnityEngine.Camera", "get_stereoActiveEye", [this.ptr]);
    }
    get stereoConvergence() {
      return window.ctx.call("UnityEngine.Camera", "get_stereoConvergence", [this.ptr]).val();
    }
    set stereoConvergence(value) {
      window.ctx.call("UnityEngine.Camera", "set_stereoConvergence", [this.ptr, value]);
    }
    get stereoEnabled() {
      return window.ctx.call("UnityEngine.Camera", "get_stereoEnabled", [this.ptr]).val() === 1;
    }
    get stereoSeparation() {
      return window.ctx.call("UnityEngine.Camera", "get_stereoSeparation", [this.ptr]).val();
    }
    set stereoSeparation(value) {
      window.ctx.call("UnityEngine.Camera", "set_stereoSeparation", [this.ptr, value]);
    }
    get stereoTargetEye() {
      return new StereoTargetEyeMask(window.ctx.call("UnityEngine.Camera", "get_stereoTargetEye", [this.ptr]));
    }
    set stereoTargetEye(value) {
      window.ctx.call("UnityEngine.Camera", "set_stereoTargetEye", [this.ptr, value]);
    }
    get stereoTargetEyeInternal() {
      return new StereoTargetEyeMask(window.ctx.call("UnityEngine.Camera", "get_stereoTargetEyeInternal", [this.ptr]));
    }
    set stereoTargetEyeInternal(value) {
      window.ctx.call("UnityEngine.Camera", "set_stereoTargetEyeInternal", [this.ptr, value]);
    }
    get targetDisplay() {
      return window.ctx.call("UnityEngine.Camera", "get_targetDisplay", [this.ptr]).val();
    }
    set targetDisplay(value) {
      window.ctx.call("UnityEngine.Camera", "set_targetDisplay", [this.ptr, value]);
    }
    get targetTexture() {
      return new RenderTexture(window.ctx.call("UnityEngine.Camera", "get_targetTexture", [this.ptr]));
    }
    set targetTexture(value) {
      window.ctx.call("UnityEngine.Camera", "set_targetTexture", [this.ptr, value]);
    }
    get transparencySortAxis() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "get_transparencySortAxis", [out, this.ptr]);
        return out;
      })();
    }
    set transparencySortAxis(value) {
      window.ctx.call("UnityEngine.Camera", "set_transparencySortAxis", [this.ptr, value]);
    }
    get transparencySortMode() {
      return new TransparencySortMode(window.ctx.call("UnityEngine.Camera", "get_transparencySortMode", [this.ptr]));
    }
    set transparencySortMode(value) {
      window.ctx.call("UnityEngine.Camera", "set_transparencySortMode", [this.ptr, value]);
    }
    get useInteractiveLightBakingData() {
      return window.ctx.call("UnityEngine.Camera", "get_useInteractiveLightBakingData", [this.ptr]).val() === 1;
    }
    set useInteractiveLightBakingData(value) {
      window.ctx.call("UnityEngine.Camera", "set_useInteractiveLightBakingData", [this.ptr, value]);
    }
    get useJitteredProjectionMatrixForTransparentRendering() {
      return (
        window.ctx
          .call("UnityEngine.Camera", "get_useJitteredProjectionMatrixForTransparentRendering", [this.ptr])
          .val() === 1
      );
    }
    set useJitteredProjectionMatrixForTransparentRendering(value) {
      window.ctx.call("UnityEngine.Camera", "set_useJitteredProjectionMatrixForTransparentRendering", [
        this.ptr,
        value,
      ]);
    }
    get useOcclusionCulling() {
      return window.ctx.call("UnityEngine.Camera", "get_useOcclusionCulling", [this.ptr]).val() === 1;
    }
    set useOcclusionCulling(value) {
      window.ctx.call("UnityEngine.Camera", "set_useOcclusionCulling", [this.ptr, value]);
    }
    get usePhysicalProperties() {
      return window.ctx.call("UnityEngine.Camera", "get_usePhysicalProperties", [this.ptr]).val() === 1;
    }
    set usePhysicalProperties(value) {
      window.ctx.call("UnityEngine.Camera", "set_usePhysicalProperties", [this.ptr, value]);
    }
    get velocity() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "get_velocity", [out, this.ptr]);
        return out;
      })();
    }
    get worldToCameraMatrix() {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Camera", "get_worldToCameraMatrix", [out, this.ptr]);
        return out;
      })();
    }
    set worldToCameraMatrix(value) {
      window.ctx.call("UnityEngine.Camera", "set_worldToCameraMatrix", [this.ptr, value]);
    }
    get m_NonSerializedVersion() {
      return this.ptr.readField(12, "i32");
    }
    set m_NonSerializedVersion(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get onPostRender() {
      return this.ptr.readField(8, "i32");
    }
    set onPostRender(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    get onPreCull() {
      return this.ptr.readField(0, "i32");
    }
    set onPreCull(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get onPreRender() {
      return this.ptr.readField(4, "i32");
    }
    set onPreRender(value) {
      return this.ptr.writeField(4, "i32", value);
    }
    AddCommandBuffer(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "AddCommandBuffer", [this.ptr, arg0, arg1]);
    }
    AddCommandBufferAsync(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "AddCommandBufferAsync", [this.ptr, arg0, arg1, arg2]);
    }
    AddCommandBufferAsyncImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "AddCommandBufferAsyncImpl", [this.ptr, arg0, arg1, arg2]);
    }
    static AddCommandBufferAsyncImpl_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Camera", "AddCommandBufferAsyncImpl_Injected", [arg0, arg1, arg2, arg3]);
    }
    AddCommandBufferImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "AddCommandBufferImpl", [this.ptr, arg0, arg1]);
    }
    static AddCommandBufferImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "AddCommandBufferImpl_Injected", [arg0, arg1, arg2]);
    }
    static BumpNonSerializedVersion(arg0) {
      window.ctx.call("UnityEngine.Camera", "BumpNonSerializedVersion", [arg0]);
    }
    CalculateFrustumCorners(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Camera", "CalculateFrustumCorners", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    CalculateFrustumCornersInternal(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Camera", "CalculateFrustumCornersInternal", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    static CalculateFrustumCornersInternal_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Camera", "CalculateFrustumCornersInternal_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    CalculateObliqueMatrix(arg0) {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Camera", "CalculateObliqueMatrix", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static CalculateObliqueMatrix_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "CalculateObliqueMatrix_Injected", [arg0, arg1, arg2]);
    }
    static CalculateProjectionMatrixFromPhysicalProperties(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      window.ctx.call("UnityEngine.Camera", "CalculateProjectionMatrixFromPhysicalProperties", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
      ]);
    }
    static CalculateProjectionMatrixFromPhysicalPropertiesInternal(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
      window.ctx.call("UnityEngine.Camera", "CalculateProjectionMatrixFromPhysicalPropertiesInternal", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
      ]);
    }
    static CalculateProjectionMatrixFromPhysicalPropertiesInternal_Injected(
      arg0,
      arg1,
      arg2,
      arg3,
      arg4,
      arg5,
      arg6,
      arg7,
    ) {
      window.ctx.call("UnityEngine.Camera", "CalculateProjectionMatrixFromPhysicalPropertiesInternal_Injected", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
      ]);
    }
    CopyFrom(arg0) {
      window.ctx.call("UnityEngine.Camera", "CopyFrom", [this.ptr, arg0]);
    }
    static CopyFrom_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "CopyFrom_Injected", [arg0, arg1]);
    }
    CopyStereoDeviceProjectionMatrixToNonJittered(arg0) {
      window.ctx.call("UnityEngine.Camera", "CopyStereoDeviceProjectionMatrixToNonJittered", [this.ptr, arg0]);
    }
    static CopyStereoDeviceProjectionMatrixToNonJittered_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "CopyStereoDeviceProjectionMatrixToNonJittered_Injected", [arg0, arg1]);
    }
    static FieldOfViewToFocalLength(arg0, arg1) {
      return window.ctx.call("UnityEngine.Camera", "FieldOfViewToFocalLength", [arg0, arg1]).val();
    }
    static FireOnPostRender(arg0) {
      window.ctx.call("UnityEngine.Camera", "FireOnPostRender", [arg0]);
    }
    static FireOnPreCull(arg0) {
      window.ctx.call("UnityEngine.Camera", "FireOnPreCull", [arg0]);
    }
    static FireOnPreRender(arg0) {
      window.ctx.call("UnityEngine.Camera", "FireOnPreRender", [arg0]);
    }
    static FocalLengthToFieldOfView(arg0, arg1) {
      return window.ctx.call("UnityEngine.Camera", "FocalLengthToFieldOfView", [arg0, arg1]).val();
    }
    static GetAllCameras(arg0) {
      return window.ctx.call("UnityEngine.Camera", "GetAllCameras", [arg0]).val();
    }
    static GetAllCamerasCount() {
      return window.ctx.call("UnityEngine.Camera", "GetAllCamerasCount", []).val();
    }
    static GetAllCamerasImpl(arg0) {
      return window.ctx.call("UnityEngine.Camera", "GetAllCamerasImpl", [arg0]).val();
    }
    static GetAllCamerasImpl_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "GetAllCamerasImpl_Injected", [arg0]).val();
    }
    GetCameraBufferWarnings() {
      return window.ctx.call("UnityEngine.Camera", "GetCameraBufferWarnings", [this.ptr]);
    }
    static GetCameraBufferWarnings_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "GetCameraBufferWarnings_Injected", [arg0]);
    }
    GetCommandBuffers(arg0) {
      return window.ctx.call("UnityEngine.Camera", "GetCommandBuffers", [this.ptr, arg0]);
    }
    GetCommandBuffersImpl(arg0) {
      return window.ctx.call("UnityEngine.Camera", "GetCommandBuffersImpl", [this.ptr, arg0]);
    }
    static GetCommandBuffersImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Camera", "GetCommandBuffersImpl_Injected", [arg0, arg1]);
    }
    static GetCullingParameters_Internal(arg0, arg1, arg2, arg3) {
      return (
        window.ctx.call("UnityEngine.Camera", "GetCullingParameters_Internal", [arg0, arg1, arg2, arg3]).val() === 1
      );
    }
    static GetCullingParameters_Internal_Injected(arg0, arg1, arg2, arg3) {
      return (
        window.ctx
          .call("UnityEngine.Camera", "GetCullingParameters_Internal_Injected", [arg0, arg1, arg2, arg3])
          .val() === 1
      );
    }
    GetFilterMode() {
      return window.ctx.call("UnityEngine.Camera", "GetFilterMode", [this.ptr]).val();
    }
    static GetFilterMode_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "GetFilterMode_Injected", [arg0]).val();
    }
    GetFrustumPlaneSizeAt(arg0) {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Camera", "GetFrustumPlaneSizeAt", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetFrustumPlaneSizeAt_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "GetFrustumPlaneSizeAt_Injected", [arg0, arg1, arg2]);
    }
    GetGateFittedFieldOfView() {
      return window.ctx.call("UnityEngine.Camera", "GetGateFittedFieldOfView", [this.ptr]).val();
    }
    static GetGateFittedFieldOfView_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "GetGateFittedFieldOfView_Injected", [arg0]).val();
    }
    GetGateFittedLensShift() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Camera", "GetGateFittedLensShift", [out, this.ptr]);
        return out;
      })();
    }
    static GetGateFittedLensShift_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "GetGateFittedLensShift_Injected", [arg0, arg1]);
    }
    GetLayerCullDistances() {
      return window.ctx.call("UnityEngine.Camera", "GetLayerCullDistances", [this.ptr]);
    }
    static GetLayerCullDistances_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "GetLayerCullDistances_Injected", [arg0, arg1]);
    }
    GetLocalSpaceAim() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "GetLocalSpaceAim", [out, this.ptr]);
        return out;
      })();
    }
    static GetLocalSpaceAim_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "GetLocalSpaceAim_Injected", [arg0, arg1]);
    }
    GetStereoNonJitteredProjectionMatrix(arg0) {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Camera", "GetStereoNonJitteredProjectionMatrix", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetStereoNonJitteredProjectionMatrix_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "GetStereoNonJitteredProjectionMatrix_Injected", [arg0, arg1, arg2]);
    }
    GetStereoProjectionMatrix(arg0) {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Camera", "GetStereoProjectionMatrix", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetStereoProjectionMatrix_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "GetStereoProjectionMatrix_Injected", [arg0, arg1, arg2]);
    }
    GetStereoViewMatrix(arg0) {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Camera", "GetStereoViewMatrix", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetStereoViewMatrix_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "GetStereoViewMatrix_Injected", [arg0, arg1, arg2]);
    }
    static HorizontalToVerticalFieldOfView(arg0, arg1) {
      return window.ctx.call("UnityEngine.Camera", "HorizontalToVerticalFieldOfView", [arg0, arg1]).val();
    }
    OnlyUsedForTesting1() {
      window.ctx.call("UnityEngine.Camera", "OnlyUsedForTesting1", [this.ptr]);
    }
    OnlyUsedForTesting2() {
      window.ctx.call("UnityEngine.Camera", "OnlyUsedForTesting2", [this.ptr]);
    }
    RemoveAllCommandBuffers() {
      window.ctx.call("UnityEngine.Camera", "RemoveAllCommandBuffers", [this.ptr]);
    }
    RemoveAllCommandBuffersImpl() {
      window.ctx.call("UnityEngine.Camera", "RemoveAllCommandBuffersImpl", [this.ptr]);
    }
    static RemoveAllCommandBuffersImpl_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "RemoveAllCommandBuffersImpl_Injected", [arg0]);
    }
    RemoveCommandBuffer(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "RemoveCommandBuffer", [this.ptr, arg0, arg1]);
    }
    RemoveCommandBufferImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "RemoveCommandBufferImpl", [this.ptr, arg0, arg1]);
    }
    static RemoveCommandBufferImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "RemoveCommandBufferImpl_Injected", [arg0, arg1, arg2]);
    }
    RemoveCommandBuffers(arg0) {
      window.ctx.call("UnityEngine.Camera", "RemoveCommandBuffers", [this.ptr, arg0]);
    }
    RemoveCommandBuffersImpl(arg0) {
      window.ctx.call("UnityEngine.Camera", "RemoveCommandBuffersImpl", [this.ptr, arg0]);
    }
    static RemoveCommandBuffersImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "RemoveCommandBuffersImpl_Injected", [arg0, arg1]);
    }
    Render() {
      window.ctx.call("UnityEngine.Camera", "Render", [this.ptr]);
    }
    RenderDontRestore() {
      window.ctx.call("UnityEngine.Camera", "RenderDontRestore", [this.ptr]);
    }
    static RenderDontRestore_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "RenderDontRestore_Injected", [arg0]);
    }
    RenderToCubemap_cubemap_faceMask(cubemap, faceMask) {
      return window.ctx.call("UnityEngine.Camera", "RenderToCubemap_20524", [this.ptr, cubemap, faceMask]).val() === 1;
    }
    RenderToCubemap_cubemap(cubemap) {
      return window.ctx.call("UnityEngine.Camera", "RenderToCubemap_20525", [this.ptr, cubemap]).val() === 1;
    }
    RenderToCubemap_cubemap_faceMask(cubemap, faceMask) {
      return window.ctx.call("UnityEngine.Camera", "RenderToCubemap_20526", [this.ptr, cubemap, faceMask]).val() === 1;
    }
    RenderToCubemap_cubemap(cubemap) {
      return window.ctx.call("UnityEngine.Camera", "RenderToCubemap_20527", [this.ptr, cubemap]).val() === 1;
    }
    RenderToCubemap_cubemap_faceMask_stereoEye(cubemap, faceMask, stereoEye) {
      return (
        window.ctx
          .call("UnityEngine.Camera", "RenderToCubemap_20533", [this.ptr, cubemap, faceMask, stereoEye])
          .val() === 1
      );
    }
    RenderToCubemapEyeImpl(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Camera", "RenderToCubemapEyeImpl", [this.ptr, arg0, arg1, arg2]).val() === 1;
    }
    static RenderToCubemapEyeImpl_Injected(arg0, arg1, arg2, arg3) {
      return (
        window.ctx.call("UnityEngine.Camera", "RenderToCubemapEyeImpl_Injected", [arg0, arg1, arg2, arg3]).val() === 1
      );
    }
    RenderToCubemapImpl(arg0, arg1) {
      return window.ctx.call("UnityEngine.Camera", "RenderToCubemapImpl", [this.ptr, arg0, arg1]).val() === 1;
    }
    static RenderToCubemapImpl_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Camera", "RenderToCubemapImpl_Injected", [arg0, arg1, arg2]).val() === 1;
    }
    RenderWithShader(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "RenderWithShader", [this.ptr, arg0, arg1]);
    }
    static RenderWithShader_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "RenderWithShader_Injected", [arg0, arg1, arg2]);
    }
    static Render_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "Render_Injected", [arg0]);
    }
    Reset() {
      window.ctx.call("UnityEngine.Camera", "Reset", [this.ptr]);
    }
    ResetAspect() {
      window.ctx.call("UnityEngine.Camera", "ResetAspect", [this.ptr]);
    }
    static ResetAspect_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "ResetAspect_Injected", [arg0]);
    }
    ResetCullingMatrix() {
      window.ctx.call("UnityEngine.Camera", "ResetCullingMatrix", [this.ptr]);
    }
    static ResetCullingMatrix_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "ResetCullingMatrix_Injected", [arg0]);
    }
    ResetProjectionMatrix() {
      window.ctx.call("UnityEngine.Camera", "ResetProjectionMatrix", [this.ptr]);
    }
    static ResetProjectionMatrix_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "ResetProjectionMatrix_Injected", [arg0]);
    }
    ResetReplacementShader() {
      window.ctx.call("UnityEngine.Camera", "ResetReplacementShader", [this.ptr]);
    }
    static ResetReplacementShader_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "ResetReplacementShader_Injected", [arg0]);
    }
    ResetStereoProjectionMatrices() {
      window.ctx.call("UnityEngine.Camera", "ResetStereoProjectionMatrices", [this.ptr]);
    }
    static ResetStereoProjectionMatrices_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "ResetStereoProjectionMatrices_Injected", [arg0]);
    }
    ResetStereoViewMatrices() {
      window.ctx.call("UnityEngine.Camera", "ResetStereoViewMatrices", [this.ptr]);
    }
    static ResetStereoViewMatrices_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "ResetStereoViewMatrices_Injected", [arg0]);
    }
    ResetTransparencySortSettings() {
      window.ctx.call("UnityEngine.Camera", "ResetTransparencySortSettings", [this.ptr]);
    }
    static ResetTransparencySortSettings_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "ResetTransparencySortSettings_Injected", [arg0]);
    }
    ResetWorldToCameraMatrix() {
      window.ctx.call("UnityEngine.Camera", "ResetWorldToCameraMatrix", [this.ptr]);
    }
    static ResetWorldToCameraMatrix_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "ResetWorldToCameraMatrix_Injected", [arg0]);
    }
    static Reset_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "Reset_Injected", [arg0]);
    }
    ScreenPointToRay_pos_eye(pos, eye) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "ScreenPointToRay_20483", [out, this.ptr, pos, eye]);
        return out;
      })();
    }
    ScreenPointToRay_pos_eye(pos, eye) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "ScreenPointToRay_20484", [out, this.ptr, pos, eye]);
        return out;
      })();
    }
    ScreenPointToRay_pos(pos) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "ScreenPointToRay_20485", [out, this.ptr, pos]);
        return out;
      })();
    }
    static ScreenPointToRay_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Camera", "ScreenPointToRay_Injected", [arg0, arg1, arg2, arg3]);
    }
    ScreenToViewportPoint(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "ScreenToViewportPoint", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static ScreenToViewportPoint_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "ScreenToViewportPoint_Injected", [arg0, arg1, arg2]);
    }
    ScreenToWorldPoint_position_eye(position, eye) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "ScreenToWorldPoint_20473", [out, this.ptr, position, eye]);
        return out;
      })();
    }
    ScreenToWorldPoint_position(position) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "ScreenToWorldPoint_20476", [out, this.ptr, position]);
        return out;
      })();
    }
    static ScreenToWorldPoint_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Camera", "ScreenToWorldPoint_Injected", [arg0, arg1, arg2, arg3]);
    }
    SetLayerCullDistances(arg0) {
      window.ctx.call("UnityEngine.Camera", "SetLayerCullDistances", [this.ptr, arg0]);
    }
    static SetLayerCullDistances_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "SetLayerCullDistances_Injected", [arg0, arg1]);
    }
    SetReplacementShader(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "SetReplacementShader", [this.ptr, arg0, arg1]);
    }
    static SetReplacementShader_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "SetReplacementShader_Injected", [arg0, arg1, arg2]);
    }
    SetStereoProjectionMatrix(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "SetStereoProjectionMatrix", [this.ptr, arg0, arg1]);
    }
    static SetStereoProjectionMatrix_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "SetStereoProjectionMatrix_Injected", [arg0, arg1, arg2]);
    }
    SetStereoViewMatrix(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "SetStereoViewMatrix", [this.ptr, arg0, arg1]);
    }
    static SetStereoViewMatrix_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "SetStereoViewMatrix_Injected", [arg0, arg1, arg2]);
    }
    SetTargetBuffers_colorBuffer_depthBuffer(colorBuffer, depthBuffer) {
      window.ctx.call("UnityEngine.Camera", "SetTargetBuffers_20453", [this.ptr, colorBuffer, depthBuffer]);
    }
    SetTargetBuffers_colorBuffer_depthBuffer(colorBuffer, depthBuffer) {
      window.ctx.call("UnityEngine.Camera", "SetTargetBuffers_20455", [this.ptr, colorBuffer, depthBuffer]);
    }
    SetTargetBuffersImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "SetTargetBuffersImpl", [this.ptr, arg0, arg1]);
    }
    static SetTargetBuffersImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "SetTargetBuffersImpl_Injected", [arg0, arg1, arg2]);
    }
    SetTargetBuffersMRTImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "SetTargetBuffersMRTImpl", [this.ptr, arg0, arg1]);
    }
    static SetTargetBuffersMRTImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "SetTargetBuffersMRTImpl_Injected", [arg0, arg1, arg2]);
    }
    static SetupCurrent(arg0) {
      window.ctx.call("UnityEngine.Camera", "SetupCurrent", [arg0]);
    }
    static SetupCurrent_Injected(arg0) {
      window.ctx.call("UnityEngine.Camera", "SetupCurrent_Injected", [arg0]);
    }
    SubmitBuiltInObjectIDRenderRequest(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.Camera", "SubmitBuiltInObjectIDRenderRequest", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
      ]);
    }
    static SubmitBuiltInObjectIDRenderRequest_Injected(arg0, arg1, arg2, arg3, arg4) {
      return window.ctx.call("UnityEngine.Camera", "SubmitBuiltInObjectIDRenderRequest_Injected", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
      ]);
    }
    SubmitRenderRequest(arg0) {
      window.ctx.call("UnityEngine.Camera", "SubmitRenderRequest", [this.ptr, arg0]);
    }
    SubmitRenderRequestsInternal(arg0) {
      window.ctx.call("UnityEngine.Camera", "SubmitRenderRequestsInternal", [this.ptr, arg0]);
    }
    static SubmitRenderRequestsInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "SubmitRenderRequestsInternal_Injected", [arg0, arg1]);
    }
    TryGetCullingParameters_cullingParameters(cullingParameters) {
      return (
        window.ctx.call("UnityEngine.Camera", "TryGetCullingParameters_20561", [this.ptr, cullingParameters]).val() ===
        1
      );
    }
    TryGetCullingParameters_stereoAware_cullingParameters(stereoAware, cullingParameters) {
      return (
        window.ctx
          .call("UnityEngine.Camera", "TryGetCullingParameters_20562", [this.ptr, stereoAware, cullingParameters])
          .val() === 1
      );
    }
    static VerticalToHorizontalFieldOfView(arg0, arg1) {
      return window.ctx.call("UnityEngine.Camera", "VerticalToHorizontalFieldOfView", [arg0, arg1]).val();
    }
    ViewportPointToRay_pos_eye(pos, eye) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "ViewportPointToRay_20480", [out, this.ptr, pos, eye]);
        return out;
      })();
    }
    ViewportPointToRay_pos_eye(pos, eye) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "ViewportPointToRay_20481", [out, this.ptr, pos, eye]);
        return out;
      })();
    }
    ViewportPointToRay_pos(pos) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "ViewportPointToRay_20482", [out, this.ptr, pos]);
        return out;
      })();
    }
    static ViewportPointToRay_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Camera", "ViewportPointToRay_Injected", [arg0, arg1, arg2, arg3]);
    }
    ViewportToScreenPoint(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "ViewportToScreenPoint", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static ViewportToScreenPoint_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Camera", "ViewportToScreenPoint_Injected", [arg0, arg1, arg2]);
    }
    ViewportToWorldPoint_position_eye(position, eye) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "ViewportToWorldPoint_20472", [out, this.ptr, position, eye]);
        return out;
      })();
    }
    ViewportToWorldPoint_position(position) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "ViewportToWorldPoint_20475", [out, this.ptr, position]);
        return out;
      })();
    }
    static ViewportToWorldPoint_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Camera", "ViewportToWorldPoint_Injected", [arg0, arg1, arg2, arg3]);
    }
    WorldToScreenPoint_position_eye(position, eye) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "WorldToScreenPoint_20470", [out, this.ptr, position, eye]);
        return out;
      })();
    }
    WorldToScreenPoint_position(position) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "WorldToScreenPoint_3045", [out, this.ptr, position]);
        return out;
      })();
    }
    static WorldToScreenPoint_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Camera", "WorldToScreenPoint_Injected", [arg0, arg1, arg2, arg3]);
    }
    WorldToViewportPoint_position_eye(position, eye) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "WorldToViewportPoint_20471", [out, this.ptr, position, eye]);
        return out;
      })();
    }
    WorldToViewportPoint_position(position) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Camera", "WorldToViewportPoint_20474", [out, this.ptr, position]);
        return out;
      })();
    }
    static WorldToViewportPoint_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Camera", "WorldToViewportPoint_Injected", [arg0, arg1, arg2, arg3]);
    }
    static get_activeTexture_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "get_activeTexture_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_actualRenderingPath_Injected(arg0) {
      return new RenderingPath(window.ctx.call("UnityEngine.Camera", "get_actualRenderingPath_Injected", [arg0]));
    }
    static get_allowDynamicResolution_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_allowDynamicResolution_Injected", [arg0]).val() === 1;
    }
    static get_allowHDR_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_allowHDR_Injected", [arg0]).val() === 1;
    }
    static get_allowMSAA_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_allowMSAA_Injected", [arg0]).val() === 1;
    }
    static get_anamorphism_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_anamorphism_Injected", [arg0]).val();
    }
    static get_aperture_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_aperture_Injected", [arg0]).val();
    }
    static get_areVRStereoViewMatricesWithinSingleCullTolerance_Injected(arg0) {
      return (
        window.ctx
          .call("UnityEngine.Camera", "get_areVRStereoViewMatricesWithinSingleCullTolerance_Injected", [arg0])
          .val() === 1
      );
    }
    static get_aspect_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_aspect_Injected", [arg0]).val();
    }
    static get_backgroundColor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_backgroundColor_Injected", [arg0, arg1]);
    }
    static get_barrelClipping_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_barrelClipping_Injected", [arg0]).val();
    }
    static get_bladeCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_bladeCount_Injected", [arg0]).val();
    }
    static get_cameraToWorldMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_cameraToWorldMatrix_Injected", [arg0, arg1]);
    }
    static get_cameraType_Injected(arg0) {
      return new CameraType(window.ctx.call("UnityEngine.Camera", "get_cameraType_Injected", [arg0]));
    }
    static get_clearFlags_Injected(arg0) {
      return new CameraClearFlags(window.ctx.call("UnityEngine.Camera", "get_clearFlags_Injected", [arg0]));
    }
    static get_clearStencilAfterLightingPass_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_clearStencilAfterLightingPass_Injected", [arg0]).val() === 1;
    }
    static get_commandBufferCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_commandBufferCount_Injected", [arg0]).val();
    }
    static get_cullingMask_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_cullingMask_Injected", [arg0]).val();
    }
    static get_cullingMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_cullingMatrix_Injected", [arg0, arg1]);
    }
    static get_currentInternal_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "get_currentInternal_Injected", [out]);
        return out;
      })();
    }
    static get_curvature_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_curvature_Injected", [arg0, arg1]);
    }
    static get_depthTextureMode_Injected(arg0) {
      return new DepthTextureMode(window.ctx.call("UnityEngine.Camera", "get_depthTextureMode_Injected", [arg0]));
    }
    static get_depth_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_depth_Injected", [arg0]).val();
    }
    static get_eventMask_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_eventMask_Injected", [arg0]).val();
    }
    static get_farClipPlane_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_farClipPlane_Injected", [arg0]).val();
    }
    static get_fieldOfView_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_fieldOfView_Injected", [arg0]).val();
    }
    static get_focalLength_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_focalLength_Injected", [arg0]).val();
    }
    static get_focusDistance_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_focusDistance_Injected", [arg0]).val();
    }
    static get_forceIntoRenderTexture_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_forceIntoRenderTexture_Injected", [arg0]).val() === 1;
    }
    static get_gateFit_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_gateFit_Injected", [arg0]);
    }
    static get_isProcessingRenderRequest_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_isProcessingRenderRequest_Injected", [arg0]).val() === 1;
    }
    static get_iso_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_iso_Injected", [arg0]).val();
    }
    static get_layerCullSphericalInternal_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_layerCullSphericalInternal_Injected", [arg0]).val() === 1;
    }
    static get_lensShift_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_lensShift_Injected", [arg0, arg1]);
    }
    static get_main_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "get_main_Injected", [out]);
        return out;
      })();
    }
    static get_nearClipPlane_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_nearClipPlane_Injected", [arg0]).val();
    }
    static get_nonJitteredProjectionMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_nonJitteredProjectionMatrix_Injected", [arg0, arg1]);
    }
    static get_opaqueSortMode_Injected(arg0) {
      return new OpaqueSortMode(window.ctx.call("UnityEngine.Camera", "get_opaqueSortMode_Injected", [arg0]));
    }
    static get_orthographicSize_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_orthographicSize_Injected", [arg0]).val();
    }
    static get_orthographic_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_orthographic_Injected", [arg0]).val() === 1;
    }
    static get_overrideSceneCullingMask_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_overrideSceneCullingMask_Injected", [arg0]).val();
    }
    static get_pixelHeight_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_pixelHeight_Injected", [arg0]).val();
    }
    static get_pixelRect_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_pixelRect_Injected", [arg0, arg1]);
    }
    static get_pixelWidth_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_pixelWidth_Injected", [arg0]).val();
    }
    static get_previousViewProjectionMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_previousViewProjectionMatrix_Injected", [arg0, arg1]);
    }
    static get_projectionMatrixMode_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_projectionMatrixMode_Injected", [arg0]);
    }
    static get_projectionMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_projectionMatrix_Injected", [arg0, arg1]);
    }
    static get_rect_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_rect_Injected", [arg0, arg1]);
    }
    static get_renderCloudsInSceneView_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_renderCloudsInSceneView_Injected", [arg0]).val() === 1;
    }
    static get_renderingPath_Injected(arg0) {
      return new RenderingPath(window.ctx.call("UnityEngine.Camera", "get_renderingPath_Injected", [arg0]));
    }
    static get_scaledPixelHeight_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_scaledPixelHeight_Injected", [arg0]).val();
    }
    static get_scaledPixelWidth_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_scaledPixelWidth_Injected", [arg0]).val();
    }
    static get_sceneCullingMask_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_sceneCullingMask_Injected", [arg0]).val();
    }
    static get_scene_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_scene_Injected", [arg0, arg1]);
    }
    static get_sensorSize_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_sensorSize_Injected", [arg0, arg1]);
    }
    static get_shutterSpeed_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_shutterSpeed_Injected", [arg0]).val();
    }
    static get_skyboxMaterial_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "get_skyboxMaterial_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_stereoActiveEye_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_stereoActiveEye_Injected", [arg0]);
    }
    static get_stereoConvergence_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_stereoConvergence_Injected", [arg0]).val();
    }
    static get_stereoEnabled_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_stereoEnabled_Injected", [arg0]).val() === 1;
    }
    static get_stereoSeparation_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_stereoSeparation_Injected", [arg0]).val();
    }
    static get_stereoTargetEyeInternal_Injected(arg0) {
      return new StereoTargetEyeMask(
        window.ctx.call("UnityEngine.Camera", "get_stereoTargetEyeInternal_Injected", [arg0]),
      );
    }
    static get_targetDisplay_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_targetDisplay_Injected", [arg0]).val();
    }
    static get_targetTexture_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Camera", "get_targetTexture_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_transparencySortAxis_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_transparencySortAxis_Injected", [arg0, arg1]);
    }
    static get_transparencySortMode_Injected(arg0) {
      return new TransparencySortMode(
        window.ctx.call("UnityEngine.Camera", "get_transparencySortMode_Injected", [arg0]),
      );
    }
    static get_useInteractiveLightBakingData_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_useInteractiveLightBakingData_Injected", [arg0]).val() === 1;
    }
    static get_useJitteredProjectionMatrixForTransparentRendering_Injected(arg0) {
      return (
        window.ctx
          .call("UnityEngine.Camera", "get_useJitteredProjectionMatrixForTransparentRendering_Injected", [arg0])
          .val() === 1
      );
    }
    static get_useOcclusionCulling_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_useOcclusionCulling_Injected", [arg0]).val() === 1;
    }
    static get_usePhysicalProperties_Injected(arg0) {
      return window.ctx.call("UnityEngine.Camera", "get_usePhysicalProperties_Injected", [arg0]).val() === 1;
    }
    static get_velocity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_velocity_Injected", [arg0, arg1]);
    }
    static get_worldToCameraMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "get_worldToCameraMatrix_Injected", [arg0, arg1]);
    }
    static set_allowDynamicResolution_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_allowDynamicResolution_Injected", [arg0, arg1]);
    }
    static set_allowHDR_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_allowHDR_Injected", [arg0, arg1]);
    }
    static set_allowMSAA_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_allowMSAA_Injected", [arg0, arg1]);
    }
    static set_anamorphism_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_anamorphism_Injected", [arg0, arg1]);
    }
    static set_aperture_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_aperture_Injected", [arg0, arg1]);
    }
    static set_aspect_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_aspect_Injected", [arg0, arg1]);
    }
    static set_backgroundColor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_backgroundColor_Injected", [arg0, arg1]);
    }
    static set_barrelClipping_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_barrelClipping_Injected", [arg0, arg1]);
    }
    static set_bladeCount_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_bladeCount_Injected", [arg0, arg1]);
    }
    static set_cameraType_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_cameraType_Injected", [arg0, arg1]);
    }
    static set_clearFlags_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_clearFlags_Injected", [arg0, arg1]);
    }
    static set_clearStencilAfterLightingPass_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_clearStencilAfterLightingPass_Injected", [arg0, arg1]);
    }
    static set_cullingMask_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_cullingMask_Injected", [arg0, arg1]);
    }
    static set_cullingMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_cullingMatrix_Injected", [arg0, arg1]);
    }
    static set_curvature_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_curvature_Injected", [arg0, arg1]);
    }
    static set_depthTextureMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_depthTextureMode_Injected", [arg0, arg1]);
    }
    static set_depth_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_depth_Injected", [arg0, arg1]);
    }
    static set_eventMask_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_eventMask_Injected", [arg0, arg1]);
    }
    static set_farClipPlane_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_farClipPlane_Injected", [arg0, arg1]);
    }
    static set_fieldOfView_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_fieldOfView_Injected", [arg0, arg1]);
    }
    static set_focalLength_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_focalLength_Injected", [arg0, arg1]);
    }
    static set_focusDistance_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_focusDistance_Injected", [arg0, arg1]);
    }
    static set_forceIntoRenderTexture_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_forceIntoRenderTexture_Injected", [arg0, arg1]);
    }
    static set_gateFit_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_gateFit_Injected", [arg0, arg1]);
    }
    static set_iso_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_iso_Injected", [arg0, arg1]);
    }
    static set_layerCullSphericalInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_layerCullSphericalInternal_Injected", [arg0, arg1]);
    }
    static set_lensShift_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_lensShift_Injected", [arg0, arg1]);
    }
    static set_nearClipPlane_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_nearClipPlane_Injected", [arg0, arg1]);
    }
    static set_nonJitteredProjectionMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_nonJitteredProjectionMatrix_Injected", [arg0, arg1]);
    }
    static set_opaqueSortMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_opaqueSortMode_Injected", [arg0, arg1]);
    }
    static set_orthographicSize_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_orthographicSize_Injected", [arg0, arg1]);
    }
    static set_orthographic_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_orthographic_Injected", [arg0, arg1]);
    }
    static set_overrideSceneCullingMask_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_overrideSceneCullingMask_Injected", [arg0, arg1]);
    }
    static set_pixelRect_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_pixelRect_Injected", [arg0, arg1]);
    }
    static set_projectionMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_projectionMatrix_Injected", [arg0, arg1]);
    }
    static set_rect_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_rect_Injected", [arg0, arg1]);
    }
    static set_renderCloudsInSceneView_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_renderCloudsInSceneView_Injected", [arg0, arg1]);
    }
    static set_renderingPath_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_renderingPath_Injected", [arg0, arg1]);
    }
    static set_scene_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_scene_Injected", [arg0, arg1]);
    }
    static set_sensorSize_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_sensorSize_Injected", [arg0, arg1]);
    }
    static set_shutterSpeed_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_shutterSpeed_Injected", [arg0, arg1]);
    }
    static set_stereoConvergence_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_stereoConvergence_Injected", [arg0, arg1]);
    }
    static set_stereoSeparation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_stereoSeparation_Injected", [arg0, arg1]);
    }
    static set_stereoTargetEyeInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_stereoTargetEyeInternal_Injected", [arg0, arg1]);
    }
    static set_targetDisplay_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_targetDisplay_Injected", [arg0, arg1]);
    }
    static set_targetTexture_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_targetTexture_Injected", [arg0, arg1]);
    }
    static set_transparencySortAxis_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_transparencySortAxis_Injected", [arg0, arg1]);
    }
    static set_transparencySortMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_transparencySortMode_Injected", [arg0, arg1]);
    }
    static set_useInteractiveLightBakingData_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_useInteractiveLightBakingData_Injected", [arg0, arg1]);
    }
    static set_useJitteredProjectionMatrixForTransparentRendering_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_useJitteredProjectionMatrixForTransparentRendering_Injected", [
        arg0,
        arg1,
      ]);
    }
    static set_useOcclusionCulling_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_useOcclusionCulling_Injected", [arg0, arg1]);
    }
    static set_usePhysicalProperties_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_usePhysicalProperties_Injected", [arg0, arg1]);
    }
    static set_worldToCameraMatrix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Camera", "set_worldToCameraMatrix_Injected", [arg0, arg1]);
    }
  }
  class CharacterCamera {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get MinVerticalAngle() {
      return window.ctx
        .call("KinematicCharacterController.Examples.CharacterCamera", "get_MinVerticalAngle", [this.ptr])
        .val();
    }
    static get RotationSpeed() {
      return window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "get_RotationSpeed", []).val();
    }
    get Transform() {
      return new Transform(
        window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "get_Transform", [this.ptr]),
      );
    }
    set Transform(value) {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "set_Transform", [this.ptr, value]);
    }
    get _Transform_k_BackingField() {
      return new Transform(this.ptr.readField(216, "i32"));
    }
    set _Transform_k_BackingField(value) {
      return this.ptr.writeField(216, "i32", value);
    }
    get FOVRotationMulti() {
      return this.ptr.readField(0, "f32").val();
    }
    set FOVRotationMulti(value) {
      return this.ptr.writeField(0, "f32", value);
    }
    get cam() {
      return new Camera(this.ptr.readField(72, "i32"));
    }
    set cam(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get crouchingHeight() {
      return new Vector3(this.ptr.readField(36, "i32"));
    }
    set crouchingHeight(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get currentCameraMode() {
      return this.ptr.readField(16, "i32");
    }
    set currentCameraMode(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get defaultHeight() {
      return new Vector3(this.ptr.readField(24, "i32"));
    }
    set defaultHeight(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get dialogFOVMultiplier() {
      return this.ptr.readField(4, "f32").val();
    }
    set dialogFOVMultiplier(value) {
      return this.ptr.writeField(4, "f32", value);
    }
    get followLookBlend() {
      return this.ptr.readField(212, "f32").val();
    }
    set followLookBlend(value) {
      return this.ptr.writeField(212, "f32", value);
    }
    get followModeOffset() {
      return new Vector3(this.ptr.readField(200, "i32"));
    }
    set followModeOffset(value) {
      return this.ptr.writeField(200, "i32", value);
    }
    get followModeTargetRotation() {
      return new Vector3(this.ptr.readField(176, "i32"));
    }
    set followModeTargetRotation(value) {
      return this.ptr.writeField(176, "i32", value);
    }
    get instance() {
      return new CharacterCamera(this.ptr.readField(8, "i32"));
    }
    set instance(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    get isFirstFrame() {
      return this.ptr.readField(80, "i32").val() === 1;
    }
    set isFirstFrame(value) {
      return this.ptr.writeField(80, "i32", value);
    }
    get isInFollowMode() {
      return this.ptr.readField(172, "i32").val() === 1;
    }
    set isInFollowMode(value) {
      return this.ptr.writeField(172, "i32", value);
    }
    get isPositionOverrideActive() {
      return this.ptr.readField(120, "i32").val() === 1;
    }
    set isPositionOverrideActive(value) {
      return this.ptr.writeField(120, "i32", value);
    }
    get isRotationOverrideActive() {
      return this.ptr.readField(104, "i32").val() === 1;
    }
    set isRotationOverrideActive(value) {
      return this.ptr.writeField(104, "i32", value);
    }
    get isTransitioningBack() {
      return this.ptr.readField(128, "i32").val() === 1;
    }
    set isTransitioningBack(value) {
      return this.ptr.writeField(128, "i32", value);
    }
    get lastMouseMovementTime() {
      return this.ptr.readField(168, "f32").val();
    }
    set lastMouseMovementTime(value) {
      return this.ptr.writeField(168, "f32", value);
    }
    get lastPlayerPosition() {
      return new Vector3(this.ptr.readField(188, "i32"));
    }
    set lastPlayerPosition(value) {
      return this.ptr.writeField(188, "i32", value);
    }
    get lobbyDistanceRaycaster() {
      return new CameraDistanceRaycaster(this.ptr.readField(68, "i32"));
    }
    set lobbyDistanceRaycaster(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get myFOVOverride() {
      return this.ptr.readField(124, "f32").val();
    }
    set myFOVOverride(value) {
      return this.ptr.writeField(124, "f32", value);
    }
    get myPlayer() {
      return new Transform(this.ptr.readField(64, "i32"));
    }
    set myPlayer(value) {
      return this.ptr.writeField(64, "i32", value);
    }
    get myPositionOverride() {
      return new Vector3(this.ptr.readField(108, "i32"));
    }
    set myPositionOverride(value) {
      return this.ptr.writeField(108, "i32", value);
    }
    get myRotationOverride() {
      return new Quaternion(this.ptr.readField(88, "i32"));
    }
    set myRotationOverride(value) {
      return this.ptr.writeField(88, "i32", value);
    }
    get neckController() {
      return new NeckController(this.ptr.readField(60, "i32"));
    }
    set neckController(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get originalParent() {
      return new Transform(this.ptr.readField(84, "i32"));
    }
    set originalParent(value) {
      return this.ptr.writeField(84, "i32", value);
    }
    get slidingHeight() {
      return new Vector3(this.ptr.readField(48, "i32"));
    }
    set slidingHeight(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    get transitionStartFOV() {
      return this.ptr.readField(160, "f32").val();
    }
    set transitionStartFOV(value) {
      return this.ptr.writeField(160, "f32", value);
    }
    get transitionStartPosition() {
      return new Vector3(this.ptr.readField(148, "i32"));
    }
    set transitionStartPosition(value) {
      return this.ptr.writeField(148, "i32", value);
    }
    get transitionStartRotation() {
      return new Quaternion(this.ptr.readField(132, "i32"));
    }
    set transitionStartRotation(value) {
      return this.ptr.writeField(132, "i32", value);
    }
    get transitionTimer() {
      return this.ptr.readField(164, "f32").val();
    }
    set transitionTimer(value) {
      return this.ptr.writeField(164, "f32", value);
    }
    get xRot() {
      return this.ptr.readField(20, "f32").val();
    }
    set xRot(value) {
      return this.ptr.writeField(20, "f32", value);
    }
    get yRot() {
      return this.ptr.readField(76, "f32").val();
    }
    set yRot(value) {
      return this.ptr.writeField(76, "f32", value);
    }
    Awake() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "Awake", [this.ptr]);
    }
    GetCameraMode() {
      return window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "GetCameraMode", [this.ptr]);
    }
    IsMouseIdle() {
      return (
        window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "IsMouseIdle", [this.ptr]).val() === 1
      );
    }
    KillOverrideState() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "KillOverrideState", [this.ptr]);
    }
    LateUpdate() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "LateUpdate", [this.ptr]);
    }
    OnCameraModeChanged() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "OnCameraModeChanged", [this.ptr]);
    }
    OnEnable() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "OnEnable", [this.ptr]);
    }
    OverrideState(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "OverrideState", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
      ]);
    }
    SetCameraMode(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "SetCameraMode", [this.ptr, arg0]);
    }
    SetYRot(arg0) {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "SetYRot", [this.ptr, arg0]);
    }
    Start() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "Start", [this.ptr]);
    }
    StartTransitionBack() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "StartTransitionBack", [this.ptr]);
    }
    Update() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "Update", [this.ptr]);
    }
    UpdateGameMode() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "UpdateGameMode", [this.ptr]);
    }
    UpdateLobbyMode() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "UpdateLobbyMode", [this.ptr]);
    }
    UpdateMouseMovementTime() {
      window.ctx.call("KinematicCharacterController.Examples.CharacterCamera", "UpdateMouseMovementTime", [this.ptr]);
    }
  }
  class Animator {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get allowConstantClipSamplingOptimization() {
      return (
        window.ctx.call("UnityEngine.Animator", "get_allowConstantClipSamplingOptimization", [this.ptr]).val() === 1
      );
    }
    set allowConstantClipSamplingOptimization(value) {
      window.ctx.call("UnityEngine.Animator", "set_allowConstantClipSamplingOptimization", [this.ptr, value]);
    }
    get angularVelocity() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "get_angularVelocity", [out, this.ptr]);
        return out;
      })();
    }
    get animatePhysics() {
      return window.ctx.call("UnityEngine.Animator", "get_animatePhysics", [this.ptr]).val() === 1;
    }
    set animatePhysics(value) {
      window.ctx.call("UnityEngine.Animator", "set_animatePhysics", [this.ptr, value]);
    }
    get applyRootMotion() {
      return window.ctx.call("UnityEngine.Animator", "get_applyRootMotion", [this.ptr]).val() === 1;
    }
    set applyRootMotion(value) {
      window.ctx.call("UnityEngine.Animator", "set_applyRootMotion", [this.ptr, value]);
    }
    get avatar() {
      return new Avatar(window.ctx.call("UnityEngine.Animator", "get_avatar", [this.ptr]));
    }
    set avatar(value) {
      window.ctx.call("UnityEngine.Animator", "set_avatar", [this.ptr, value]);
    }
    get avatarRoot() {
      return new Transform(window.ctx.call("UnityEngine.Animator", "get_avatarRoot", [this.ptr]));
    }
    get bodyPosition() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "get_bodyPosition", [out, this.ptr]);
        return out;
      })();
    }
    set bodyPosition(value) {
      window.ctx.call("UnityEngine.Animator", "set_bodyPosition", [this.ptr, value]);
    }
    get bodyPositionInternal() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "get_bodyPositionInternal", [out, this.ptr]);
        return out;
      })();
    }
    set bodyPositionInternal(value) {
      window.ctx.call("UnityEngine.Animator", "set_bodyPositionInternal", [this.ptr, value]);
    }
    get bodyRotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Animator", "get_bodyRotation", [out, this.ptr]);
        return out;
      })();
    }
    set bodyRotation(value) {
      window.ctx.call("UnityEngine.Animator", "set_bodyRotation", [this.ptr, value]);
    }
    get bodyRotationInternal() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Animator", "get_bodyRotationInternal", [out, this.ptr]);
        return out;
      })();
    }
    set bodyRotationInternal(value) {
      window.ctx.call("UnityEngine.Animator", "set_bodyRotationInternal", [this.ptr, value]);
    }
    get cullingMode() {
      return new AnimatorCullingMode(window.ctx.call("UnityEngine.Animator", "get_cullingMode", [this.ptr]));
    }
    set cullingMode(value) {
      window.ctx.call("UnityEngine.Animator", "set_cullingMode", [this.ptr, value]);
    }
    get deltaPosition() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "get_deltaPosition", [out, this.ptr]);
        return out;
      })();
    }
    get deltaRotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Animator", "get_deltaRotation", [out, this.ptr]);
        return out;
      })();
    }
    get feetPivotActive() {
      return window.ctx.call("UnityEngine.Animator", "get_feetPivotActive", [this.ptr]).val();
    }
    set feetPivotActive(value) {
      window.ctx.call("UnityEngine.Animator", "set_feetPivotActive", [this.ptr, value]);
    }
    get fireEvents() {
      return window.ctx.call("UnityEngine.Animator", "get_fireEvents", [this.ptr]).val() === 1;
    }
    set fireEvents(value) {
      window.ctx.call("UnityEngine.Animator", "set_fireEvents", [this.ptr, value]);
    }
    get gravityWeight() {
      return window.ctx.call("UnityEngine.Animator", "get_gravityWeight", [this.ptr]).val();
    }
    get hasBoundPlayables() {
      return window.ctx.call("UnityEngine.Animator", "get_hasBoundPlayables", [this.ptr]).val() === 1;
    }
    get hasRootMotion() {
      return window.ctx.call("UnityEngine.Animator", "get_hasRootMotion", [this.ptr]).val() === 1;
    }
    get hasTransformHierarchy() {
      return window.ctx.call("UnityEngine.Animator", "get_hasTransformHierarchy", [this.ptr]).val() === 1;
    }
    get humanScale() {
      return window.ctx.call("UnityEngine.Animator", "get_humanScale", [this.ptr]).val();
    }
    get isHuman() {
      return window.ctx.call("UnityEngine.Animator", "get_isHuman", [this.ptr]).val() === 1;
    }
    get isInitialized() {
      return window.ctx.call("UnityEngine.Animator", "get_isInitialized", [this.ptr]).val() === 1;
    }
    get isMatchingTarget() {
      return window.ctx.call("UnityEngine.Animator", "get_isMatchingTarget", [this.ptr]).val() === 1;
    }
    get isOptimizable() {
      return window.ctx.call("UnityEngine.Animator", "get_isOptimizable", [this.ptr]).val() === 1;
    }
    get isRootPositionOrRotationControlledByCurves() {
      return (
        window.ctx.call("UnityEngine.Animator", "get_isRootPositionOrRotationControlledByCurves", [this.ptr]).val() ===
        1
      );
    }
    get keepAnimatorControllerStateOnDisable() {
      return (
        window.ctx.call("UnityEngine.Animator", "get_keepAnimatorControllerStateOnDisable", [this.ptr]).val() === 1
      );
    }
    set keepAnimatorControllerStateOnDisable(value) {
      window.ctx.call("UnityEngine.Animator", "set_keepAnimatorControllerStateOnDisable", [this.ptr, value]);
    }
    get keepAnimatorStateOnDisable() {
      return window.ctx.call("UnityEngine.Animator", "get_keepAnimatorStateOnDisable", [this.ptr]).val() === 1;
    }
    set keepAnimatorStateOnDisable(value) {
      window.ctx.call("UnityEngine.Animator", "set_keepAnimatorStateOnDisable", [this.ptr, value]);
    }
    get layerCount() {
      return window.ctx.call("UnityEngine.Animator", "get_layerCount", [this.ptr]).val();
    }
    get layersAffectMassCenter() {
      return window.ctx.call("UnityEngine.Animator", "get_layersAffectMassCenter", [this.ptr]).val() === 1;
    }
    set layersAffectMassCenter(value) {
      window.ctx.call("UnityEngine.Animator", "set_layersAffectMassCenter", [this.ptr, value]);
    }
    get leftFeetBottomHeight() {
      return window.ctx.call("UnityEngine.Animator", "get_leftFeetBottomHeight", [this.ptr]).val();
    }
    get linearVelocityBlending() {
      return window.ctx.call("UnityEngine.Animator", "get_linearVelocityBlending", [this.ptr]).val() === 1;
    }
    set linearVelocityBlending(value) {
      window.ctx.call("UnityEngine.Animator", "set_linearVelocityBlending", [this.ptr, value]);
    }
    get logWarnings() {
      return window.ctx.call("UnityEngine.Animator", "get_logWarnings", [this.ptr]).val() === 1;
    }
    set logWarnings(value) {
      window.ctx.call("UnityEngine.Animator", "set_logWarnings", [this.ptr, value]);
    }
    get parameterCount() {
      return window.ctx.call("UnityEngine.Animator", "get_parameterCount", [this.ptr]).val();
    }
    get parameters() {
      return window.ctx.call("UnityEngine.Animator", "get_parameters", [this.ptr]);
    }
    get pivotPosition() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "get_pivotPosition", [out, this.ptr]);
        return out;
      })();
    }
    get pivotWeight() {
      return window.ctx.call("UnityEngine.Animator", "get_pivotWeight", [this.ptr]).val();
    }
    get playableGraph() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Animator", "get_playableGraph", [out, this.ptr]);
        return out;
      })();
    }
    get playbackTime() {
      return window.ctx.call("UnityEngine.Animator", "get_playbackTime", [this.ptr]).val();
    }
    set playbackTime(value) {
      window.ctx.call("UnityEngine.Animator", "set_playbackTime", [this.ptr, value]);
    }
    get recorderMode() {
      return new AnimatorRecorderMode(window.ctx.call("UnityEngine.Animator", "get_recorderMode", [this.ptr]));
    }
    get recorderStartTime() {
      return window.ctx.call("UnityEngine.Animator", "get_recorderStartTime", [this.ptr]).val();
    }
    set recorderStartTime(value) {
      window.ctx.call("UnityEngine.Animator", "set_recorderStartTime", [this.ptr, value]);
    }
    get recorderStopTime() {
      return window.ctx.call("UnityEngine.Animator", "get_recorderStopTime", [this.ptr]).val();
    }
    set recorderStopTime(value) {
      window.ctx.call("UnityEngine.Animator", "set_recorderStopTime", [this.ptr, value]);
    }
    get rightFeetBottomHeight() {
      return window.ctx.call("UnityEngine.Animator", "get_rightFeetBottomHeight", [this.ptr]).val();
    }
    get rootPosition() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "get_rootPosition", [out, this.ptr]);
        return out;
      })();
    }
    set rootPosition(value) {
      window.ctx.call("UnityEngine.Animator", "set_rootPosition", [this.ptr, value]);
    }
    get rootRotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Animator", "get_rootRotation", [out, this.ptr]);
        return out;
      })();
    }
    set rootRotation(value) {
      window.ctx.call("UnityEngine.Animator", "set_rootRotation", [this.ptr, value]);
    }
    get runtimeAnimatorController() {
      return new RuntimeAnimatorController(
        window.ctx.call("UnityEngine.Animator", "get_runtimeAnimatorController", [this.ptr]),
      );
    }
    set runtimeAnimatorController(value) {
      window.ctx.call("UnityEngine.Animator", "set_runtimeAnimatorController", [this.ptr, value]);
    }
    get speed() {
      return window.ctx.call("UnityEngine.Animator", "get_speed", [this.ptr]).val();
    }
    set speed(value) {
      window.ctx.call("UnityEngine.Animator", "set_speed", [this.ptr, value]);
    }
    get stabilizeFeet() {
      return window.ctx.call("UnityEngine.Animator", "get_stabilizeFeet", [this.ptr]).val() === 1;
    }
    set stabilizeFeet(value) {
      window.ctx.call("UnityEngine.Animator", "set_stabilizeFeet", [this.ptr, value]);
    }
    get supportsOnAnimatorMove() {
      return window.ctx.call("UnityEngine.Animator", "get_supportsOnAnimatorMove", [this.ptr]).val() === 1;
    }
    get targetPosition() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "get_targetPosition", [out, this.ptr]);
        return out;
      })();
    }
    get targetRotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Animator", "get_targetRotation", [out, this.ptr]);
        return out;
      })();
    }
    get updateMode() {
      return new AnimatorUpdateMode(window.ctx.call("UnityEngine.Animator", "get_updateMode", [this.ptr]));
    }
    set updateMode(value) {
      window.ctx.call("UnityEngine.Animator", "set_updateMode", [this.ptr, value]);
    }
    get velocity() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "get_velocity", [out, this.ptr]);
        return out;
      })();
    }
    get writeDefaultValuesOnDisable() {
      return window.ctx.call("UnityEngine.Animator", "get_writeDefaultValuesOnDisable", [this.ptr]).val() === 1;
    }
    set writeDefaultValuesOnDisable(value) {
      window.ctx.call("UnityEngine.Animator", "set_writeDefaultValuesOnDisable", [this.ptr, value]);
    }
    ApplyBuiltinRootMotion() {
      window.ctx.call("UnityEngine.Animator", "ApplyBuiltinRootMotion", [this.ptr]);
    }
    static ApplyBuiltinRootMotion_Injected(arg0) {
      window.ctx.call("UnityEngine.Animator", "ApplyBuiltinRootMotion_Injected", [arg0]);
    }
    CheckIfInIKPass() {
      window.ctx.call("UnityEngine.Animator", "CheckIfInIKPass", [this.ptr]);
    }
    ClearInternalControllerPlayable() {
      window.ctx.call("UnityEngine.Animator", "ClearInternalControllerPlayable", [this.ptr]);
    }
    static ClearInternalControllerPlayable_Injected(arg0) {
      window.ctx.call("UnityEngine.Animator", "ClearInternalControllerPlayable_Injected", [arg0]);
    }
    static ConvertStateMachineBehaviour(arg0) {
      return window.ctx.call("UnityEngine.Animator", "ConvertStateMachineBehaviour", [arg0]);
    }
    CrossFade_stateName_normalizedTransitionDuration_layer_normalizedTimeOffset(
      stateName,
      normalizedTransitionDuration,
      layer,
      normalizedTimeOffset,
    ) {
      window.ctx.call("UnityEngine.Animator", "CrossFade_19259", [
        this.ptr,
        stateName,
        normalizedTransitionDuration,
        layer,
        normalizedTimeOffset,
      ]);
    }
    CrossFade_stateName_normalizedTransitionDuration_layer(stateName, normalizedTransitionDuration, layer) {
      window.ctx.call("UnityEngine.Animator", "CrossFade_19260", [
        this.ptr,
        stateName,
        normalizedTransitionDuration,
        layer,
      ]);
    }
    CrossFade_stateName_normalizedTransitionDuration(stateName, normalizedTransitionDuration) {
      window.ctx.call("UnityEngine.Animator", "CrossFade_19261", [this.ptr, stateName, normalizedTransitionDuration]);
    }
    CrossFade_stateName_normalizedTransitionDuration_layer_normalizedTimeOffset_normalizedTransitionTime(
      stateName,
      normalizedTransitionDuration,
      layer,
      normalizedTimeOffset,
      normalizedTransitionTime,
    ) {
      window.ctx.call("UnityEngine.Animator", "CrossFade_19262", [
        this.ptr,
        stateName,
        normalizedTransitionDuration,
        layer,
        normalizedTimeOffset,
        normalizedTransitionTime,
      ]);
    }
    CrossFade_stateHashName_normalizedTransitionDuration_layer_normalizedTimeOffset_normalizedTransitionTime(
      stateHashName,
      normalizedTransitionDuration,
      layer,
      normalizedTimeOffset,
      normalizedTransitionTime,
    ) {
      window.ctx.call("UnityEngine.Animator", "CrossFade_19263", [
        this.ptr,
        stateHashName,
        normalizedTransitionDuration,
        layer,
        normalizedTimeOffset,
        normalizedTransitionTime,
      ]);
    }
    CrossFade_stateHashName_normalizedTransitionDuration_layer_normalizedTimeOffset(
      stateHashName,
      normalizedTransitionDuration,
      layer,
      normalizedTimeOffset,
    ) {
      window.ctx.call("UnityEngine.Animator", "CrossFade_19264", [
        this.ptr,
        stateHashName,
        normalizedTransitionDuration,
        layer,
        normalizedTimeOffset,
      ]);
    }
    CrossFade_stateHashName_normalizedTransitionDuration_layer(stateHashName, normalizedTransitionDuration, layer) {
      window.ctx.call("UnityEngine.Animator", "CrossFade_19265", [
        this.ptr,
        stateHashName,
        normalizedTransitionDuration,
        layer,
      ]);
    }
    CrossFade_stateHashName_normalizedTransitionDuration(stateHashName, normalizedTransitionDuration) {
      window.ctx.call("UnityEngine.Animator", "CrossFade_19266", [
        this.ptr,
        stateHashName,
        normalizedTransitionDuration,
      ]);
    }
    CrossFadeInFixedTime_stateName_fixedTransitionDuration(stateName, fixedTransitionDuration) {
      window.ctx.call("UnityEngine.Animator", "CrossFadeInFixedTime_19250", [
        this.ptr,
        stateName,
        fixedTransitionDuration,
      ]);
    }
    CrossFadeInFixedTime_stateName_fixedTransitionDuration_layer(stateName, fixedTransitionDuration, layer) {
      window.ctx.call("UnityEngine.Animator", "CrossFadeInFixedTime_19251", [
        this.ptr,
        stateName,
        fixedTransitionDuration,
        layer,
      ]);
    }
    CrossFadeInFixedTime_stateName_fixedTransitionDuration_layer_fixedTimeOffset(
      stateName,
      fixedTransitionDuration,
      layer,
      fixedTimeOffset,
    ) {
      window.ctx.call("UnityEngine.Animator", "CrossFadeInFixedTime_19252", [
        this.ptr,
        stateName,
        fixedTransitionDuration,
        layer,
        fixedTimeOffset,
      ]);
    }
    CrossFadeInFixedTime_stateName_fixedTransitionDuration_layer_fixedTimeOffset_normalizedTransitionTime(
      stateName,
      fixedTransitionDuration,
      layer,
      fixedTimeOffset,
      normalizedTransitionTime,
    ) {
      window.ctx.call("UnityEngine.Animator", "CrossFadeInFixedTime_19253", [
        this.ptr,
        stateName,
        fixedTransitionDuration,
        layer,
        fixedTimeOffset,
        normalizedTransitionTime,
      ]);
    }
    CrossFadeInFixedTime_stateHashName_fixedTransitionDuration_layer_fixedTimeOffset(
      stateHashName,
      fixedTransitionDuration,
      layer,
      fixedTimeOffset,
    ) {
      window.ctx.call("UnityEngine.Animator", "CrossFadeInFixedTime_19254", [
        this.ptr,
        stateHashName,
        fixedTransitionDuration,
        layer,
        fixedTimeOffset,
      ]);
    }
    CrossFadeInFixedTime_stateHashName_fixedTransitionDuration_layer(stateHashName, fixedTransitionDuration, layer) {
      window.ctx.call("UnityEngine.Animator", "CrossFadeInFixedTime_19255", [
        this.ptr,
        stateHashName,
        fixedTransitionDuration,
        layer,
      ]);
    }
    CrossFadeInFixedTime_stateHashName_fixedTransitionDuration(stateHashName, fixedTransitionDuration) {
      window.ctx.call("UnityEngine.Animator", "CrossFadeInFixedTime_19256", [
        this.ptr,
        stateHashName,
        fixedTransitionDuration,
      ]);
    }
    CrossFadeInFixedTime_stateHashName_fixedTransitionDuration_layer_fixedTimeOffset_normalizedTransitionTime(
      stateHashName,
      fixedTransitionDuration,
      layer,
      fixedTimeOffset,
      normalizedTransitionTime,
    ) {
      window.ctx.call("UnityEngine.Animator", "CrossFadeInFixedTime_19257", [
        this.ptr,
        stateHashName,
        fixedTransitionDuration,
        layer,
        fixedTimeOffset,
        normalizedTransitionTime,
      ]);
    }
    static CrossFadeInFixedTime_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.Animator", "CrossFadeInFixedTime_Injected", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    static CrossFade_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.Animator", "CrossFade_Injected", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    EvaluateController_pointer() {
      window.ctx.call("UnityEngine.Animator", "EvaluateController_19346", [this.ptr]);
    }
    EvaluateController_deltaTime(deltaTime) {
      window.ctx.call("UnityEngine.Animator", "EvaluateController_19347", [this.ptr, deltaTime]);
    }
    static EvaluateController_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "EvaluateController_Injected", [arg0, arg1]);
    }
    ForceStateNormalizedTime(arg0) {
      window.ctx.call("UnityEngine.Animator", "ForceStateNormalizedTime", [this.ptr, arg0]);
    }
    GetAnimatorClipInfoCount(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetAnimatorClipInfoCount", [this.ptr, arg0, arg1]).val();
    }
    static GetAnimatorClipInfoCount_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Animator", "GetAnimatorClipInfoCount_Injected", [arg0, arg1, arg2]).val();
    }
    GetAnimatorClipInfoInternal(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "GetAnimatorClipInfoInternal", [this.ptr, arg0, arg1, arg2]);
    }
    static GetAnimatorClipInfoInternal_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Animator", "GetAnimatorClipInfoInternal_Injected", [arg0, arg1, arg2, arg3]);
    }
    GetAnimatorStateInfo(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "GetAnimatorStateInfo", [this.ptr, arg0, arg1, arg2]);
    }
    static GetAnimatorStateInfo_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Animator", "GetAnimatorStateInfo_Injected", [arg0, arg1, arg2, arg3]);
    }
    GetAnimatorStateName(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetAnimatorStateName", [this.ptr, arg0, arg1]);
    }
    static GetAnimatorStateName_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Animator", "GetAnimatorStateName_Injected", [arg0, arg1, arg2, arg3]);
    }
    GetAnimatorTransitionInfo_layerIndex_info(layerIndex, info) {
      window.ctx.call("UnityEngine.Animator", "GetAnimatorTransitionInfo_19222", [this.ptr, layerIndex, info]);
    }
    GetAnimatorTransitionInfo_layerIndex(layerIndex) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Animator", "GetAnimatorTransitionInfo_19223", [out, this.ptr, layerIndex]);
        return out;
      })();
    }
    static GetAnimatorTransitionInfo_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "GetAnimatorTransitionInfo_Injected", [arg0, arg1, arg2]);
    }
    GetBehaviour_type(type) {
      return new ScriptableObject(window.ctx.call("UnityEngine.Animator", "GetBehaviour_19208", [this.ptr, type]));
    }
    GetBehaviour() {
      return window.ctx.call("UnityEngine.Animator", "GetBehaviour", [this.ptr]);
    }
    static GetBehaviour_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Animator", "GetBehaviour_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    GetBehaviours() {
      return window.ctx.call("UnityEngine.Animator", "GetBehaviours", [this.ptr]);
    }
    GetBehaviours_fullPathHash_layerIndex(fullPathHash, layerIndex) {
      return window.ctx.call("UnityEngine.Animator", "GetBehaviours_19210", [this.ptr, fullPathHash, layerIndex]);
    }
    GetBoneTransform(arg0) {
      return new Transform(window.ctx.call("UnityEngine.Animator", "GetBoneTransform", [this.ptr, arg0]));
    }
    GetBoneTransformInternal(arg0) {
      return new Transform(window.ctx.call("UnityEngine.Animator", "GetBoneTransformInternal", [this.ptr, arg0]));
    }
    static GetBoneTransformInternal_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Animator", "GetBoneTransformInternal_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    GetBool_name(name) {
      return window.ctx.call("UnityEngine.Animator", "GetBool_19133", [this.ptr, name]).val() === 1;
    }
    GetBool_id(id) {
      return window.ctx.call("UnityEngine.Animator", "GetBool_19134", [this.ptr, id]).val() === 1;
    }
    GetBoolID(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetBoolID", [this.ptr, arg0]).val() === 1;
    }
    static GetBoolID_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetBoolID_Injected", [arg0, arg1]).val() === 1;
    }
    GetBoolString(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetBoolString", [this.ptr, arg0]).val() === 1;
    }
    static GetBoolString_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetBoolString_Injected", [arg0, arg1]).val() === 1;
    }
    GetCurrentAnimatorClipInfo_layerIndex(layerIndex) {
      return window.ctx.call("UnityEngine.Animator", "GetCurrentAnimatorClipInfo_19227", [this.ptr, layerIndex]);
    }
    GetCurrentAnimatorClipInfo_layerIndex_clips(layerIndex, clips) {
      window.ctx.call("UnityEngine.Animator", "GetCurrentAnimatorClipInfo_19229", [this.ptr, layerIndex, clips]);
    }
    GetCurrentAnimatorClipInfoCount(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetCurrentAnimatorClipInfoCount", [this.ptr, arg0]).val();
    }
    static GetCurrentAnimatorClipInfo_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetCurrentAnimatorClipInfo_Injected", [arg0, arg1]);
    }
    GetCurrentAnimatorStateInfo(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Animator", "GetCurrentAnimatorStateInfo", [out, this.ptr, arg0]);
        return out;
      })();
    }
    GetCurrentGraph(arg0) {
      window.ctx.call("UnityEngine.Animator", "GetCurrentGraph", [this.ptr, arg0]);
    }
    static GetCurrentGraph_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "GetCurrentGraph_Injected", [arg0, arg1]);
    }
    GetCurrentStateName(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetCurrentStateName", [this.ptr, arg0]);
    }
    GetFloat_name(name) {
      return window.ctx.call("UnityEngine.Animator", "GetFloat_19127", [this.ptr, name]).val();
    }
    GetFloat_id(id) {
      return window.ctx.call("UnityEngine.Animator", "GetFloat_19128", [this.ptr, id]).val();
    }
    GetFloatID(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetFloatID", [this.ptr, arg0]).val();
    }
    static GetFloatID_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetFloatID_Injected", [arg0, arg1]).val();
    }
    GetFloatString(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetFloatString", [this.ptr, arg0]).val();
    }
    static GetFloatString_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetFloatString_Injected", [arg0, arg1]).val();
    }
    GetGoalPosition(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "GetGoalPosition", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetGoalPosition_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "GetGoalPosition_Injected", [arg0, arg1, arg2]);
    }
    GetGoalRotation(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Animator", "GetGoalRotation", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetGoalRotation_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "GetGoalRotation_Injected", [arg0, arg1, arg2]);
    }
    GetGoalWeightPosition(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetGoalWeightPosition", [this.ptr, arg0]).val();
    }
    static GetGoalWeightPosition_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetGoalWeightPosition_Injected", [arg0, arg1]).val();
    }
    GetGoalWeightRotation(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetGoalWeightRotation", [this.ptr, arg0]).val();
    }
    static GetGoalWeightRotation_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetGoalWeightRotation_Injected", [arg0, arg1]).val();
    }
    GetHintPosition(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "GetHintPosition", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetHintPosition_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "GetHintPosition_Injected", [arg0, arg1, arg2]);
    }
    GetHintWeightPosition(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetHintWeightPosition", [this.ptr, arg0]).val();
    }
    static GetHintWeightPosition_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetHintWeightPosition_Injected", [arg0, arg1]).val();
    }
    GetIKHintPosition(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "GetIKHintPosition", [out, this.ptr, arg0]);
        return out;
      })();
    }
    GetIKHintPositionWeight(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetIKHintPositionWeight", [this.ptr, arg0]).val();
    }
    GetIKPosition(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "GetIKPosition", [out, this.ptr, arg0]);
        return out;
      })();
    }
    GetIKPositionWeight(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetIKPositionWeight", [this.ptr, arg0]).val();
    }
    GetIKRotation(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Animator", "GetIKRotation", [out, this.ptr, arg0]);
        return out;
      })();
    }
    GetIKRotationWeight(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetIKRotationWeight", [this.ptr, arg0]).val();
    }
    GetInteger_name(name) {
      return window.ctx.call("UnityEngine.Animator", "GetInteger_19137", [this.ptr, name]).val();
    }
    GetInteger_id(id) {
      return window.ctx.call("UnityEngine.Animator", "GetInteger_19138", [this.ptr, id]).val();
    }
    GetIntegerID(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetIntegerID", [this.ptr, arg0]).val();
    }
    static GetIntegerID_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetIntegerID_Injected", [arg0, arg1]).val();
    }
    GetIntegerString(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetIntegerString", [this.ptr, arg0]).val();
    }
    static GetIntegerString_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetIntegerString_Injected", [arg0, arg1]).val();
    }
    GetLayerIndex(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetLayerIndex", [this.ptr, arg0]).val();
    }
    static GetLayerIndex_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetLayerIndex_Injected", [arg0, arg1]).val();
    }
    GetLayerName(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetLayerName", [this.ptr, arg0]);
    }
    static GetLayerName_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "GetLayerName_Injected", [arg0, arg1, arg2]);
    }
    GetLayerWeight(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetLayerWeight", [this.ptr, arg0]).val();
    }
    static GetLayerWeight_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetLayerWeight_Injected", [arg0, arg1]).val();
    }
    GetNextAnimatorClipInfo_layerIndex(layerIndex) {
      return window.ctx.call("UnityEngine.Animator", "GetNextAnimatorClipInfo_19228", [this.ptr, layerIndex]);
    }
    GetNextAnimatorClipInfo_layerIndex_clips(layerIndex, clips) {
      window.ctx.call("UnityEngine.Animator", "GetNextAnimatorClipInfo_19231", [this.ptr, layerIndex, clips]);
    }
    GetNextAnimatorClipInfoCount(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetNextAnimatorClipInfoCount", [this.ptr, arg0]).val();
    }
    static GetNextAnimatorClipInfo_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "GetNextAnimatorClipInfo_Injected", [arg0, arg1]);
    }
    GetNextAnimatorStateInfo(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Animator", "GetNextAnimatorStateInfo", [out, this.ptr, arg0]);
        return out;
      })();
    }
    GetNextStateName(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetNextStateName", [this.ptr, arg0]);
    }
    GetParameter(arg0) {
      return new AnimatorControllerParameter(window.ctx.call("UnityEngine.Animator", "GetParameter", [this.ptr, arg0]));
    }
    GetParameterInternal(arg0) {
      return new AnimatorControllerParameter(
        window.ctx.call("UnityEngine.Animator", "GetParameterInternal", [this.ptr, arg0]),
      );
    }
    static GetParameterInternal_Injected(arg0, arg1) {
      return new AnimatorControllerParameter(
        window.ctx.call("UnityEngine.Animator", "GetParameterInternal_Injected", [arg0, arg1]),
      );
    }
    GetQuaternion_name(name) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Animator", "GetQuaternion_19366", [out, this.ptr, name]);
        return out;
      })();
    }
    GetQuaternion_id(id) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Animator", "GetQuaternion_19367", [out, this.ptr, id]);
        return out;
      })();
    }
    GetRecorderStartTime() {
      return window.ctx.call("UnityEngine.Animator", "GetRecorderStartTime", [this.ptr]).val();
    }
    static GetRecorderStartTime_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetRecorderStartTime_Injected", [arg0]).val();
    }
    GetRecorderStopTime() {
      return window.ctx.call("UnityEngine.Animator", "GetRecorderStopTime", [this.ptr]).val();
    }
    static GetRecorderStopTime_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "GetRecorderStopTime_Injected", [arg0]).val();
    }
    GetStats() {
      return window.ctx.call("UnityEngine.Animator", "GetStats", [this.ptr]);
    }
    static GetStats_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "GetStats_Injected", [arg0, arg1]);
    }
    GetVector_name(name) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "GetVector_19362", [out, this.ptr, name]);
        return out;
      })();
    }
    GetVector_id(id) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Animator", "GetVector_19363", [out, this.ptr, id]);
        return out;
      })();
    }
    HasState(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "HasState", [this.ptr, arg0, arg1]).val() === 1;
    }
    static HasState_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Animator", "HasState_Injected", [arg0, arg1, arg2]).val() === 1;
    }
    InternalGetBehaviours(arg0) {
      return window.ctx.call("UnityEngine.Animator", "InternalGetBehaviours", [this.ptr, arg0]);
    }
    InternalGetBehavioursByKey(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Animator", "InternalGetBehavioursByKey", [this.ptr, arg0, arg1, arg2]);
    }
    static InternalGetBehavioursByKey_Injected(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.Animator", "InternalGetBehavioursByKey_Injected", [arg0, arg1, arg2, arg3]);
    }
    static InternalGetBehaviours_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "InternalGetBehaviours_Injected", [arg0, arg1]);
    }
    InterruptMatchTarget_pointer() {
      window.ctx.call("UnityEngine.Animator", "InterruptMatchTarget_19245", [this.ptr]);
    }
    InterruptMatchTarget_completeMatch(completeMatch) {
      window.ctx.call("UnityEngine.Animator", "InterruptMatchTarget_19246", [this.ptr, completeMatch]);
    }
    static InterruptMatchTarget_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "InterruptMatchTarget_Injected", [arg0, arg1]);
    }
    IsBoneTransform(arg0) {
      return window.ctx.call("UnityEngine.Animator", "IsBoneTransform", [this.ptr, arg0]).val() === 1;
    }
    static IsBoneTransform_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "IsBoneTransform_Injected", [arg0, arg1]).val() === 1;
    }
    IsControlled(arg0) {
      return window.ctx.call("UnityEngine.Animator", "IsControlled", [this.ptr, arg0]).val() === 1;
    }
    IsInIKPass() {
      return window.ctx.call("UnityEngine.Animator", "IsInIKPass", [this.ptr]).val() === 1;
    }
    static IsInIKPass_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "IsInIKPass_Injected", [arg0]).val() === 1;
    }
    IsInTransition(arg0) {
      return window.ctx.call("UnityEngine.Animator", "IsInTransition", [this.ptr, arg0]).val() === 1;
    }
    static IsInTransition_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Animator", "IsInTransition_Injected", [arg0, arg1]).val() === 1;
    }
    IsParameterControlledByCurve_name(name) {
      return (
        window.ctx.call("UnityEngine.Animator", "IsParameterControlledByCurve_19144", [this.ptr, name]).val() === 1
      );
    }
    IsParameterControlledByCurve_id(id) {
      return window.ctx.call("UnityEngine.Animator", "IsParameterControlledByCurve_19145", [this.ptr, id]).val() === 1;
    }
    IsParameterControlledByCurveID(arg0) {
      return window.ctx.call("UnityEngine.Animator", "IsParameterControlledByCurveID", [this.ptr, arg0]).val() === 1;
    }
    static IsParameterControlledByCurveID_Injected(arg0, arg1) {
      return (
        window.ctx.call("UnityEngine.Animator", "IsParameterControlledByCurveID_Injected", [arg0, arg1]).val() === 1
      );
    }
    IsParameterControlledByCurveString(arg0) {
      return (
        window.ctx.call("UnityEngine.Animator", "IsParameterControlledByCurveString", [this.ptr, arg0]).val() === 1
      );
    }
    static IsParameterControlledByCurveString_Injected(arg0, arg1) {
      return (
        window.ctx.call("UnityEngine.Animator", "IsParameterControlledByCurveString_Injected", [arg0, arg1]).val() === 1
      );
    }
    MatchTarget_matchPosition_matchRotation_targetBodyPart_weightMask_startNormalizedTime_targetNormalizedTime_completeMatch(
      matchPosition,
      matchRotation,
      targetBodyPart,
      weightMask,
      startNormalizedTime,
      targetNormalizedTime,
      completeMatch,
    ) {
      window.ctx.call("UnityEngine.Animator", "MatchTarget_19241", [
        this.ptr,
        matchPosition,
        matchRotation,
        targetBodyPart,
        weightMask,
        startNormalizedTime,
        targetNormalizedTime,
        completeMatch,
      ]);
    }
    MatchTarget_matchPosition_matchRotation_targetBodyPart_weightMask_startNormalizedTime(
      matchPosition,
      matchRotation,
      targetBodyPart,
      weightMask,
      startNormalizedTime,
    ) {
      window.ctx.call("UnityEngine.Animator", "MatchTarget_19242", [
        this.ptr,
        matchPosition,
        matchRotation,
        targetBodyPart,
        weightMask,
        startNormalizedTime,
      ]);
    }
    MatchTarget_matchPosition_matchRotation_targetBodyPart_weightMask_startNormalizedTime_targetNormalizedTime(
      matchPosition,
      matchRotation,
      targetBodyPart,
      weightMask,
      startNormalizedTime,
      targetNormalizedTime,
    ) {
      window.ctx.call("UnityEngine.Animator", "MatchTarget_19243", [
        this.ptr,
        matchPosition,
        matchRotation,
        targetBodyPart,
        weightMask,
        startNormalizedTime,
        targetNormalizedTime,
      ]);
    }
    MatchTarget_matchPosition_matchRotation_targetBodyPart_weightMask_startNormalizedTime_targetNormalizedTime_completeMatch(
      matchPosition,
      matchRotation,
      targetBodyPart,
      weightMask,
      startNormalizedTime,
      targetNormalizedTime,
      completeMatch,
    ) {
      window.ctx.call("UnityEngine.Animator", "MatchTarget_19244", [
        this.ptr,
        matchPosition,
        matchRotation,
        targetBodyPart,
        weightMask,
        startNormalizedTime,
        targetNormalizedTime,
        completeMatch,
      ]);
    }
    static MatchTarget_Injected(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
      window.ctx.call("UnityEngine.Animator", "MatchTarget_Injected", [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7]);
    }
    OnCullingModeChanged() {
      window.ctx.call("UnityEngine.Animator", "OnCullingModeChanged", [this.ptr]);
    }
    static OnCullingModeChanged_Injected(arg0) {
      window.ctx.call("UnityEngine.Animator", "OnCullingModeChanged_Injected", [arg0]);
    }
    OnUpdateModeChanged() {
      window.ctx.call("UnityEngine.Animator", "OnUpdateModeChanged", [this.ptr]);
    }
    static OnUpdateModeChanged_Injected(arg0) {
      window.ctx.call("UnityEngine.Animator", "OnUpdateModeChanged_Injected", [arg0]);
    }
    Play_stateName_layer(stateName, layer) {
      window.ctx.call("UnityEngine.Animator", "Play_19273", [this.ptr, stateName, layer]);
    }
    Play_stateName(stateName) {
      window.ctx.call("UnityEngine.Animator", "Play_19274", [this.ptr, stateName]);
    }
    Play_stateName_layer_normalizedTime(stateName, layer, normalizedTime) {
      window.ctx.call("UnityEngine.Animator", "Play_19275", [this.ptr, stateName, layer, normalizedTime]);
    }
    Play_stateNameHash_layer_normalizedTime(stateNameHash, layer, normalizedTime) {
      window.ctx.call("UnityEngine.Animator", "Play_19276", [this.ptr, stateNameHash, layer, normalizedTime]);
    }
    Play_stateNameHash_layer(stateNameHash, layer) {
      window.ctx.call("UnityEngine.Animator", "Play_19277", [this.ptr, stateNameHash, layer]);
    }
    Play_stateNameHash(stateNameHash) {
      window.ctx.call("UnityEngine.Animator", "Play_19278", [this.ptr, stateNameHash]);
    }
    PlayInFixedTime_stateName_layer(stateName, layer) {
      window.ctx.call("UnityEngine.Animator", "PlayInFixedTime_19267", [this.ptr, stateName, layer]);
    }
    PlayInFixedTime_stateName(stateName) {
      window.ctx.call("UnityEngine.Animator", "PlayInFixedTime_19268", [this.ptr, stateName]);
    }
    PlayInFixedTime_stateName_layer_fixedTime(stateName, layer, fixedTime) {
      window.ctx.call("UnityEngine.Animator", "PlayInFixedTime_19269", [this.ptr, stateName, layer, fixedTime]);
    }
    PlayInFixedTime_stateNameHash_layer_fixedTime(stateNameHash, layer, fixedTime) {
      window.ctx.call("UnityEngine.Animator", "PlayInFixedTime_19270", [this.ptr, stateNameHash, layer, fixedTime]);
    }
    PlayInFixedTime_stateNameHash_layer(stateNameHash, layer) {
      window.ctx.call("UnityEngine.Animator", "PlayInFixedTime_19271", [this.ptr, stateNameHash, layer]);
    }
    PlayInFixedTime_stateNameHash(stateNameHash) {
      window.ctx.call("UnityEngine.Animator", "PlayInFixedTime_19272", [this.ptr, stateNameHash]);
    }
    static PlayInFixedTime_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Animator", "PlayInFixedTime_Injected", [arg0, arg1, arg2, arg3]);
    }
    static Play_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Animator", "Play_Injected", [arg0, arg1, arg2, arg3]);
    }
    Rebind_pointer() {
      window.ctx.call("UnityEngine.Animator", "Rebind_2546", [this.ptr]);
    }
    Rebind_writeDefaultValues(writeDefaultValues) {
      window.ctx.call("UnityEngine.Animator", "Rebind_19344", [this.ptr, writeDefaultValues]);
    }
    static Rebind_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "Rebind_Injected", [arg0, arg1]);
    }
    ResetControllerState(arg0) {
      window.ctx.call("UnityEngine.Animator", "ResetControllerState", [this.ptr, arg0]);
    }
    static ResetControllerState_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "ResetControllerState_Injected", [arg0, arg1]);
    }
    ResetTrigger_name(name) {
      window.ctx.call("UnityEngine.Animator", "ResetTrigger_19142", [this.ptr, name]);
    }
    ResetTrigger_id(id) {
      window.ctx.call("UnityEngine.Animator", "ResetTrigger_19143", [this.ptr, id]);
    }
    ResetTriggerID(arg0) {
      window.ctx.call("UnityEngine.Animator", "ResetTriggerID", [this.ptr, arg0]);
    }
    static ResetTriggerID_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "ResetTriggerID_Injected", [arg0, arg1]);
    }
    ResetTriggerString(arg0) {
      window.ctx.call("UnityEngine.Animator", "ResetTriggerString", [this.ptr, arg0]);
    }
    static ResetTriggerString_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "ResetTriggerString_Injected", [arg0, arg1]);
    }
    ResolveHash(arg0) {
      return window.ctx.call("UnityEngine.Animator", "ResolveHash", [this.ptr, arg0]);
    }
    static ResolveHash_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "ResolveHash_Injected", [arg0, arg1, arg2]);
    }
    SetBoneLocalRotation(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetBoneLocalRotation", [this.ptr, arg0, arg1]);
    }
    SetBoneLocalRotationInternal(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetBoneLocalRotationInternal", [this.ptr, arg0, arg1]);
    }
    static SetBoneLocalRotationInternal_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetBoneLocalRotationInternal_Injected", [arg0, arg1, arg2]);
    }
    SetBool_name_value(name, value) {
      window.ctx.call("UnityEngine.Animator", "SetBool_19135", [this.ptr, name, value]);
    }
    SetBool_id_value(id, value) {
      window.ctx.call("UnityEngine.Animator", "SetBool_19136", [this.ptr, id, value]);
    }
    SetBoolID(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetBoolID", [this.ptr, arg0, arg1]);
    }
    static SetBoolID_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetBoolID_Injected", [arg0, arg1, arg2]);
    }
    SetBoolString(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetBoolString", [this.ptr, arg0, arg1]);
    }
    static SetBoolString_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetBoolString_Injected", [arg0, arg1, arg2]);
    }
    SetFloat_name_value(name, value) {
      window.ctx.call("UnityEngine.Animator", "SetFloat_19129", [this.ptr, name, value]);
    }
    SetFloat_name_value_dampTime_deltaTime(name, value, dampTime, deltaTime) {
      window.ctx.call("UnityEngine.Animator", "SetFloat_19130", [this.ptr, name, value, dampTime, deltaTime]);
    }
    SetFloat_id_value(id, value) {
      window.ctx.call("UnityEngine.Animator", "SetFloat_19131", [this.ptr, id, value]);
    }
    SetFloat_id_value_dampTime_deltaTime(id, value, dampTime, deltaTime) {
      window.ctx.call("UnityEngine.Animator", "SetFloat_19132", [this.ptr, id, value, dampTime, deltaTime]);
    }
    SetFloatID(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetFloatID", [this.ptr, arg0, arg1]);
    }
    SetFloatIDDamp(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Animator", "SetFloatIDDamp", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    static SetFloatIDDamp_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Animator", "SetFloatIDDamp_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    static SetFloatID_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetFloatID_Injected", [arg0, arg1, arg2]);
    }
    SetFloatString(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetFloatString", [this.ptr, arg0, arg1]);
    }
    SetFloatStringDamp(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Animator", "SetFloatStringDamp", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    static SetFloatStringDamp_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Animator", "SetFloatStringDamp_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    static SetFloatString_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetFloatString_Injected", [arg0, arg1, arg2]);
    }
    SetGoalPosition(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetGoalPosition", [this.ptr, arg0, arg1]);
    }
    static SetGoalPosition_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetGoalPosition_Injected", [arg0, arg1, arg2]);
    }
    SetGoalRotation(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetGoalRotation", [this.ptr, arg0, arg1]);
    }
    static SetGoalRotation_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetGoalRotation_Injected", [arg0, arg1, arg2]);
    }
    SetGoalWeightPosition(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetGoalWeightPosition", [this.ptr, arg0, arg1]);
    }
    static SetGoalWeightPosition_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetGoalWeightPosition_Injected", [arg0, arg1, arg2]);
    }
    SetGoalWeightRotation(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetGoalWeightRotation", [this.ptr, arg0, arg1]);
    }
    static SetGoalWeightRotation_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetGoalWeightRotation_Injected", [arg0, arg1, arg2]);
    }
    SetHintPosition(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetHintPosition", [this.ptr, arg0, arg1]);
    }
    static SetHintPosition_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetHintPosition_Injected", [arg0, arg1, arg2]);
    }
    SetHintWeightPosition(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetHintWeightPosition", [this.ptr, arg0, arg1]);
    }
    static SetHintWeightPosition_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetHintWeightPosition_Injected", [arg0, arg1, arg2]);
    }
    SetIKHintPosition(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetIKHintPosition", [this.ptr, arg0, arg1]);
    }
    SetIKHintPositionWeight(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetIKHintPositionWeight", [this.ptr, arg0, arg1]);
    }
    SetIKPosition(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetIKPosition", [this.ptr, arg0, arg1]);
    }
    SetIKPositionWeight(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetIKPositionWeight", [this.ptr, arg0, arg1]);
    }
    SetIKRotation(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetIKRotation", [this.ptr, arg0, arg1]);
    }
    SetIKRotationWeight(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetIKRotationWeight", [this.ptr, arg0, arg1]);
    }
    SetInteger_name_value(name, value) {
      window.ctx.call("UnityEngine.Animator", "SetInteger_19139", [this.ptr, name, value]);
    }
    SetInteger_id_value(id, value) {
      window.ctx.call("UnityEngine.Animator", "SetInteger_19140", [this.ptr, id, value]);
    }
    SetIntegerID(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetIntegerID", [this.ptr, arg0, arg1]);
    }
    static SetIntegerID_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetIntegerID_Injected", [arg0, arg1, arg2]);
    }
    SetIntegerString(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetIntegerString", [this.ptr, arg0, arg1]);
    }
    static SetIntegerString_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetIntegerString_Injected", [arg0, arg1, arg2]);
    }
    SetLayerWeight(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetLayerWeight", [this.ptr, arg0, arg1]);
    }
    static SetLayerWeight_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetLayerWeight_Injected", [arg0, arg1, arg2]);
    }
    SetLookAtPosition(arg0) {
      window.ctx.call("UnityEngine.Animator", "SetLookAtPosition", [this.ptr, arg0]);
    }
    SetLookAtPositionInternal(arg0) {
      window.ctx.call("UnityEngine.Animator", "SetLookAtPositionInternal", [this.ptr, arg0]);
    }
    static SetLookAtPositionInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetLookAtPositionInternal_Injected", [arg0, arg1]);
    }
    SetLookAtWeight_weight(weight) {
      window.ctx.call("UnityEngine.Animator", "SetLookAtWeight_19200", [this.ptr, weight]);
    }
    SetLookAtWeight_weight_bodyWeight(weight, bodyWeight) {
      window.ctx.call("UnityEngine.Animator", "SetLookAtWeight_19201", [this.ptr, weight, bodyWeight]);
    }
    SetLookAtWeight_weight_bodyWeight_headWeight(weight, bodyWeight, headWeight) {
      window.ctx.call("UnityEngine.Animator", "SetLookAtWeight_19202", [this.ptr, weight, bodyWeight, headWeight]);
    }
    SetLookAtWeight_weight_bodyWeight_headWeight_eyesWeight(weight, bodyWeight, headWeight, eyesWeight) {
      window.ctx.call("UnityEngine.Animator", "SetLookAtWeight_19203", [
        this.ptr,
        weight,
        bodyWeight,
        headWeight,
        eyesWeight,
      ]);
    }
    SetLookAtWeight_weight_bodyWeight_headWeight_eyesWeight_clampWeight(
      weight,
      bodyWeight,
      headWeight,
      eyesWeight,
      clampWeight,
    ) {
      window.ctx.call("UnityEngine.Animator", "SetLookAtWeight_19204", [
        this.ptr,
        weight,
        bodyWeight,
        headWeight,
        eyesWeight,
        clampWeight,
      ]);
    }
    SetLookAtWeightInternal(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Animator", "SetLookAtWeightInternal", [this.ptr, arg0, arg1, arg2, arg3, arg4]);
    }
    static SetLookAtWeightInternal_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.Animator", "SetLookAtWeightInternal_Injected", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    SetQuaternion_name_value(name, value) {
      window.ctx.call("UnityEngine.Animator", "SetQuaternion_19368", [this.ptr, name, value]);
    }
    SetQuaternion_id_value(id, value) {
      window.ctx.call("UnityEngine.Animator", "SetQuaternion_19369", [this.ptr, id, value]);
    }
    SetTarget(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetTarget", [this.ptr, arg0, arg1]);
    }
    static SetTarget_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Animator", "SetTarget_Injected", [arg0, arg1, arg2]);
    }
    SetTrigger_name(name) {
      window.ctx.call("UnityEngine.Animator", "SetTrigger_2674", [this.ptr, name]);
    }
    SetTrigger_id(id) {
      window.ctx.call("UnityEngine.Animator", "SetTrigger_19141", [this.ptr, id]);
    }
    SetTriggerID(arg0) {
      window.ctx.call("UnityEngine.Animator", "SetTriggerID", [this.ptr, arg0]);
    }
    static SetTriggerID_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetTriggerID_Injected", [arg0, arg1]);
    }
    SetTriggerString(arg0) {
      window.ctx.call("UnityEngine.Animator", "SetTriggerString", [this.ptr, arg0]);
    }
    static SetTriggerString_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "SetTriggerString_Injected", [arg0, arg1]);
    }
    SetVector_name_value(name, value) {
      window.ctx.call("UnityEngine.Animator", "SetVector_19364", [this.ptr, name, value]);
    }
    SetVector_id_value(id, value) {
      window.ctx.call("UnityEngine.Animator", "SetVector_19365", [this.ptr, id, value]);
    }
    StartPlayback() {
      window.ctx.call("UnityEngine.Animator", "StartPlayback", [this.ptr]);
    }
    static StartPlayback_Injected(arg0) {
      window.ctx.call("UnityEngine.Animator", "StartPlayback_Injected", [arg0]);
    }
    StartRecording(arg0) {
      window.ctx.call("UnityEngine.Animator", "StartRecording", [this.ptr, arg0]);
    }
    static StartRecording_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "StartRecording_Injected", [arg0, arg1]);
    }
    StopPlayback() {
      window.ctx.call("UnityEngine.Animator", "StopPlayback", [this.ptr]);
    }
    static StopPlayback_Injected(arg0) {
      window.ctx.call("UnityEngine.Animator", "StopPlayback_Injected", [arg0]);
    }
    StopRecording() {
      window.ctx.call("UnityEngine.Animator", "StopRecording", [this.ptr]);
    }
    static StopRecording_Injected(arg0) {
      window.ctx.call("UnityEngine.Animator", "StopRecording_Injected", [arg0]);
    }
    static StringToHash(arg0) {
      return window.ctx.call("UnityEngine.Animator", "StringToHash", [arg0]).val();
    }
    static StringToHash_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "StringToHash_Injected", [arg0]).val();
    }
    Update(arg0) {
      window.ctx.call("UnityEngine.Animator", "Update", [this.ptr, arg0]);
    }
    static Update_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "Update_Injected", [arg0, arg1]);
    }
    WriteDefaultPose() {
      window.ctx.call("UnityEngine.Animator", "WriteDefaultPose", [this.ptr]);
    }
    static WriteDefaultPose_Injected(arg0) {
      window.ctx.call("UnityEngine.Animator", "WriteDefaultPose_Injected", [arg0]);
    }
    WriteDefaultValues() {
      window.ctx.call("UnityEngine.Animator", "WriteDefaultValues", [this.ptr]);
    }
    static WriteDefaultValues_Injected(arg0) {
      window.ctx.call("UnityEngine.Animator", "WriteDefaultValues_Injected", [arg0]);
    }
    static get_allowConstantClipSamplingOptimization_Injected(arg0) {
      return (
        window.ctx.call("UnityEngine.Animator", "get_allowConstantClipSamplingOptimization_Injected", [arg0]).val() ===
        1
      );
    }
    static get_angularVelocity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_angularVelocity_Injected", [arg0, arg1]);
    }
    static get_animatePhysics_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_animatePhysics_Injected", [arg0]).val() === 1;
    }
    static get_applyRootMotion_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_applyRootMotion_Injected", [arg0]).val() === 1;
    }
    static get_avatarRoot_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Animator", "get_avatarRoot_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_avatar_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Animator", "get_avatar_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_bodyPositionInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_bodyPositionInternal_Injected", [arg0, arg1]);
    }
    static get_bodyRotationInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_bodyRotationInternal_Injected", [arg0, arg1]);
    }
    static get_cullingMode_Injected(arg0) {
      return new AnimatorCullingMode(window.ctx.call("UnityEngine.Animator", "get_cullingMode_Injected", [arg0]));
    }
    static get_deltaPosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_deltaPosition_Injected", [arg0, arg1]);
    }
    static get_deltaRotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_deltaRotation_Injected", [arg0, arg1]);
    }
    static get_feetPivotActive_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_feetPivotActive_Injected", [arg0]).val();
    }
    static get_fireEvents_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_fireEvents_Injected", [arg0]).val() === 1;
    }
    static get_gravityWeight_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_gravityWeight_Injected", [arg0]).val();
    }
    static get_hasBoundPlayables_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_hasBoundPlayables_Injected", [arg0]).val() === 1;
    }
    static get_hasRootMotion_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_hasRootMotion_Injected", [arg0]).val() === 1;
    }
    static get_hasTransformHierarchy_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_hasTransformHierarchy_Injected", [arg0]).val() === 1;
    }
    static get_humanScale_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_humanScale_Injected", [arg0]).val();
    }
    static get_isHuman_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_isHuman_Injected", [arg0]).val() === 1;
    }
    static get_isInitialized_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_isInitialized_Injected", [arg0]).val() === 1;
    }
    static get_isMatchingTarget_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_isMatchingTarget_Injected", [arg0]).val() === 1;
    }
    static get_isOptimizable_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_isOptimizable_Injected", [arg0]).val() === 1;
    }
    static get_isRootPositionOrRotationControlledByCurves_Injected(arg0) {
      return (
        window.ctx
          .call("UnityEngine.Animator", "get_isRootPositionOrRotationControlledByCurves_Injected", [arg0])
          .val() === 1
      );
    }
    static get_keepAnimatorStateOnDisable_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_keepAnimatorStateOnDisable_Injected", [arg0]).val() === 1;
    }
    static get_layerCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_layerCount_Injected", [arg0]).val();
    }
    static get_layersAffectMassCenter_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_layersAffectMassCenter_Injected", [arg0]).val() === 1;
    }
    static get_leftFeetBottomHeight_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_leftFeetBottomHeight_Injected", [arg0]).val();
    }
    static get_linearVelocityBlending_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_linearVelocityBlending_Injected", [arg0]).val() === 1;
    }
    static get_logWarnings_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_logWarnings_Injected", [arg0]).val() === 1;
    }
    static get_parameterCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_parameterCount_Injected", [arg0]).val();
    }
    static get_parameters_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_parameters_Injected", [arg0]);
    }
    static get_pivotPosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_pivotPosition_Injected", [arg0, arg1]);
    }
    static get_pivotWeight_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_pivotWeight_Injected", [arg0]).val();
    }
    static get_playbackTime_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_playbackTime_Injected", [arg0]).val();
    }
    static get_recorderMode_Injected(arg0) {
      return new AnimatorRecorderMode(window.ctx.call("UnityEngine.Animator", "get_recorderMode_Injected", [arg0]));
    }
    static get_rightFeetBottomHeight_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_rightFeetBottomHeight_Injected", [arg0]).val();
    }
    static get_rootPosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_rootPosition_Injected", [arg0, arg1]);
    }
    static get_rootRotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_rootRotation_Injected", [arg0, arg1]);
    }
    static get_runtimeAnimatorController_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Animator", "get_runtimeAnimatorController_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_speed_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_speed_Injected", [arg0]).val();
    }
    static get_stabilizeFeet_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_stabilizeFeet_Injected", [arg0]).val() === 1;
    }
    static get_supportsOnAnimatorMove_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_supportsOnAnimatorMove_Injected", [arg0]).val() === 1;
    }
    static get_targetPosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_targetPosition_Injected", [arg0, arg1]);
    }
    static get_targetRotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_targetRotation_Injected", [arg0, arg1]);
    }
    static get_updateMode_Injected(arg0) {
      return new AnimatorUpdateMode(window.ctx.call("UnityEngine.Animator", "get_updateMode_Injected", [arg0]));
    }
    static get_velocity_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "get_velocity_Injected", [arg0, arg1]);
    }
    static get_writeDefaultValuesOnDisable_Injected(arg0) {
      return window.ctx.call("UnityEngine.Animator", "get_writeDefaultValuesOnDisable_Injected", [arg0]).val() === 1;
    }
    static set_allowConstantClipSamplingOptimization_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_allowConstantClipSamplingOptimization_Injected", [arg0, arg1]);
    }
    static set_animatePhysics_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_animatePhysics_Injected", [arg0, arg1]);
    }
    static set_applyRootMotion_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_applyRootMotion_Injected", [arg0, arg1]);
    }
    static set_avatar_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_avatar_Injected", [arg0, arg1]);
    }
    static set_bodyPositionInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_bodyPositionInternal_Injected", [arg0, arg1]);
    }
    static set_bodyRotationInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_bodyRotationInternal_Injected", [arg0, arg1]);
    }
    static set_cullingMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_cullingMode_Injected", [arg0, arg1]);
    }
    static set_feetPivotActive_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_feetPivotActive_Injected", [arg0, arg1]);
    }
    static set_fireEvents_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_fireEvents_Injected", [arg0, arg1]);
    }
    static set_keepAnimatorStateOnDisable_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_keepAnimatorStateOnDisable_Injected", [arg0, arg1]);
    }
    static set_layersAffectMassCenter_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_layersAffectMassCenter_Injected", [arg0, arg1]);
    }
    static set_linearVelocityBlending_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_linearVelocityBlending_Injected", [arg0, arg1]);
    }
    static set_logWarnings_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_logWarnings_Injected", [arg0, arg1]);
    }
    static set_playbackTime_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_playbackTime_Injected", [arg0, arg1]);
    }
    static set_rootPosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_rootPosition_Injected", [arg0, arg1]);
    }
    static set_rootRotation_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_rootRotation_Injected", [arg0, arg1]);
    }
    static set_runtimeAnimatorController_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_runtimeAnimatorController_Injected", [arg0, arg1]);
    }
    static set_speed_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_speed_Injected", [arg0, arg1]);
    }
    static set_stabilizeFeet_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_stabilizeFeet_Injected", [arg0, arg1]);
    }
    static set_updateMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_updateMode_Injected", [arg0, arg1]);
    }
    static set_writeDefaultValuesOnDisable_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Animator", "set_writeDefaultValuesOnDisable_Injected", [arg0, arg1]);
    }
  }
  class Color {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    static get black() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_black", [out]);
        return out;
      })();
    }
    static get blue() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_blue", [out]);
        return out;
      })();
    }
    static get clear() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_clear", [out]);
        return out;
      })();
    }
    get gamma() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_gamma", [out, this.ptr]);
        return out;
      })();
    }
    static get gray() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_gray", [out]);
        return out;
      })();
    }
    static get gray5() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_gray5", [out]);
        return out;
      })();
    }
    static get green() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_green", [out]);
        return out;
      })();
    }
    get linear() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_linear", [out, this.ptr]);
        return out;
      })();
    }
    static get magenta() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_magenta", [out]);
        return out;
      })();
    }
    get maxColorComponent() {
      return window.ctx.call("UnityEngine.Color", "get_maxColorComponent", [this.ptr]).val();
    }
    static get red() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_red", [out]);
        return out;
      })();
    }
    static get white() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_white", [out]);
        return out;
      })();
    }
    static get yellow() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "get_yellow", [out]);
        return out;
      })();
    }
    get a() {
      return this.ptr.readField(12, "f32").val();
    }
    set a(value) {
      return this.ptr.writeField(12, "f32", value);
    }
    get b() {
      return this.ptr.readField(8, "f32").val();
    }
    set b(value) {
      return this.ptr.writeField(8, "f32", value);
    }
    get g() {
      return this.ptr.readField(4, "f32").val();
    }
    set g(value) {
      return this.ptr.writeField(4, "f32", value);
    }
    get r() {
      return this.ptr.readField(0, "f32").val();
    }
    set r(value) {
      return this.ptr.writeField(0, "f32", value);
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.Color", "Equals_23250", [this.ptr, other]).val() === 1;
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.Color", "Equals_23251", [this.ptr, other]).val() === 1;
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.Color", "Equals_23252", [this.ptr, other]).val() === 1;
    }
    GetHashCode() {
      return window.ctx.call("UnityEngine.Color", "GetHashCode", [this.ptr]).val();
    }
    static HSVToRGB_H_S_V(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "HSVToRGB_23268", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static HSVToRGB_H_S_V_hdr(arg0, arg1, arg2, arg3) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "HSVToRGB_23269", [out, arg0, arg1, arg2, arg3]);
        return out;
      })();
    }
    static Lerp(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "Lerp", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    RGBMultiplied(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Color", "RGBMultiplied", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static RGBToHSV(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Color", "RGBToHSV", [arg0, arg1, arg2, arg3]);
    }
    static RGBToHSVHelper(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      window.ctx.call("UnityEngine.Color", "RGBToHSVHelper", [arg0, arg1, arg2, arg3, arg4, arg5, arg6]);
    }
    ToString_pointer() {
      return window.ctx.call("UnityEngine.Color", "ToString_23247", [this.ptr]);
    }
    ToString_format_formatProvider(format, formatProvider) {
      return window.ctx.call("UnityEngine.Color", "ToString_23248", [this.ptr, format, formatProvider]);
    }
  }
  class Bullet {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get bulletGfx() {
      return new GameObject(this.ptr.readField(88, "i32"));
    }
    set bulletGfx(value) {
      return this.ptr.writeField(88, "i32", value);
    }
    get hitName() {
      return this.ptr.readField(96, "i32");
    }
    set hitName(value) {
      return this.ptr.writeField(96, "i32", value);
    }
    get impactPrefab() {
      return new GameObject(this.ptr.readField(32, "i32"));
    }
    set impactPrefab(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get initialSpeed() {
      return this.ptr.readField(40, "f32").val();
    }
    set initialSpeed(value) {
      return this.ptr.writeField(40, "f32", value);
    }
    get initialized() {
      return this.ptr.readField(16, "i32").val() === 1;
    }
    set initialized(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get isGlobal() {
      return this.ptr.readField(28, "i32").val() === 1;
    }
    set isGlobal(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get lifeDistance() {
      return this.ptr.readField(64, "f32").val();
    }
    set lifeDistance(value) {
      return this.ptr.writeField(64, "f32", value);
    }
    get lifeEnded() {
      return this.ptr.readField(68, "i32").val() === 1;
    }
    set lifeEnded(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get lifetime() {
      return this.ptr.readField(24, "f32").val();
    }
    set lifetime(value) {
      return this.ptr.writeField(24, "f32", value);
    }
    get mapLayerMask() {
      return new LayerMask(this.ptr.readField(20, "i32"));
    }
    set mapLayerMask(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get moveDir() {
      return new Vector3(this.ptr.readField(52, "i32"));
    }
    set moveDir(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get myShotId() {
      return this.ptr.readField(112, "i32").val();
    }
    set myShotId(value) {
      return this.ptr.writeField(112, "i32", value);
    }
    get shootAt() {
      return new Vector3(this.ptr.readField(100, "i32"));
    }
    set shootAt(value) {
      return this.ptr.writeField(100, "i32", value);
    }
    get spawnTime() {
      return this.ptr.readField(84, "f32").val();
    }
    set spawnTime(value) {
      return this.ptr.writeField(84, "f32", value);
    }
    get speed() {
      return this.ptr.readField(44, "f32").val();
    }
    set speed(value) {
      return this.ptr.writeField(44, "f32", value);
    }
    get speedMultiCurve() {
      return new AnimationCurve(this.ptr.readField(48, "i32"));
    }
    set speedMultiCurve(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    get startingPosition() {
      return new Vector3(this.ptr.readField(72, "i32"));
    }
    set startingPosition(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get stop() {
      return this.ptr.readField(92, "i32").val() === 1;
    }
    set stop(value) {
      return this.ptr.writeField(92, "i32", value);
    }
    get trailRenderer() {
      return new TrailRenderer(this.ptr.readField(36, "i32"));
    }
    set trailRenderer(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    Init(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("Bullet", "Init", [this.ptr, arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    OnDespawn() {
      window.ctx.call("Bullet", "OnDespawn", [this.ptr]);
    }
    OnSpawn() {
      window.ctx.call("Bullet", "OnSpawn", [this.ptr]);
    }
    TryEndLife(arg0, arg1) {
      window.ctx.call("Bullet", "TryEndLife", [this.ptr, arg0, arg1]);
    }
    Update() {
      window.ctx.call("Bullet", "Update", [this.ptr]);
    }
  }
  class RecoilData {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get aimJumpForceMulti() {
      return this.ptr.readField(192, "f32").val();
    }
    set aimJumpForceMulti(value) {
      return this.ptr.writeField(192, "f32", value);
    }
    get aimLandForceMulti() {
      return this.ptr.readField(196, "f32").val();
    }
    set aimLandForceMulti(value) {
      return this.ptr.writeField(196, "f32", value);
    }
    get aimTransitionSpeed() {
      return this.ptr.readField(188, "f32").val();
    }
    set aimTransitionSpeed(value) {
      return this.ptr.writeField(188, "f32", value);
    }
    get blockedPosition() {
      return new Vector3(this.ptr.readField(124, "i32"));
    }
    set blockedPosition(value) {
      return this.ptr.writeField(124, "i32", value);
    }
    get blockedRotation() {
      return new Vector3(this.ptr.readField(136, "i32"));
    }
    set blockedRotation(value) {
      return this.ptr.writeField(136, "i32", value);
    }
    get blockedTransitionSpeed() {
      return this.ptr.readField(172, "f32").val();
    }
    set blockedTransitionSpeed(value) {
      return this.ptr.writeField(172, "f32", value);
    }
    get crouchPosition() {
      return new Vector3(this.ptr.readField(148, "i32"));
    }
    set crouchPosition(value) {
      return this.ptr.writeField(148, "i32", value);
    }
    get crouchRotation() {
      return new Vector3(this.ptr.readField(160, "i32"));
    }
    set crouchRotation(value) {
      return this.ptr.writeField(160, "i32", value);
    }
    get defaultPosition() {
      return new Vector3(this.ptr.readField(12, "i32"));
    }
    set defaultPosition(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get defaultRotation() {
      return new Vector3(this.ptr.readField(24, "i32"));
    }
    set defaultRotation(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get defaultTransitionSpeed() {
      return this.ptr.readField(36, "f32").val();
    }
    set defaultTransitionSpeed(value) {
      return this.ptr.writeField(36, "f32", value);
    }
    get jumpingPosition() {
      return new Vector3(this.ptr.readField(40, "i32"));
    }
    set jumpingPosition(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get jumpingRotation() {
      return new Vector3(this.ptr.readField(52, "i32"));
    }
    set jumpingRotation(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get jumpingTransitionSpeed() {
      return this.ptr.readField(64, "f32").val();
    }
    set jumpingTransitionSpeed(value) {
      return this.ptr.writeField(64, "f32", value);
    }
    get noiseAmplitudeAimingPos() {
      return new Vector3(this.ptr.readField(356, "i32"));
    }
    set noiseAmplitudeAimingPos(value) {
      return this.ptr.writeField(356, "i32", value);
    }
    get noiseAmplitudeAimingRot() {
      return new Vector3(this.ptr.readField(380, "i32"));
    }
    set noiseAmplitudeAimingRot(value) {
      return this.ptr.writeField(380, "i32", value);
    }
    get noiseAmplitudeRegularPos() {
      return new Vector3(this.ptr.readField(344, "i32"));
    }
    set noiseAmplitudeRegularPos(value) {
      return this.ptr.writeField(344, "i32", value);
    }
    get noiseAmplitudeRegularRot() {
      return new Vector3(this.ptr.readField(368, "i32"));
    }
    set noiseAmplitudeRegularRot(value) {
      return this.ptr.writeField(368, "i32", value);
    }
    get positionDuringJump() {
      return new Vector3(this.ptr.readField(272, "i32"));
    }
    set positionDuringJump(value) {
      return this.ptr.writeField(272, "i32", value);
    }
    get positionDuringJumpAndSprint() {
      return new Vector3(this.ptr.readField(284, "i32"));
    }
    set positionDuringJumpAndSprint(value) {
      return this.ptr.writeField(284, "i32", value);
    }
    get positionJumpAmount() {
      return new Vector3(this.ptr.readField(248, "i32"));
    }
    set positionJumpAmount(value) {
      return this.ptr.writeField(248, "i32", value);
    }
    get positionLandAmount() {
      return new Vector3(this.ptr.readField(320, "i32"));
    }
    set positionLandAmount(value) {
      return this.ptr.writeField(320, "i32", value);
    }
    get positionRecoilAmount() {
      return new Vector3(this.ptr.readField(200, "i32"));
    }
    set positionRecoilAmount(value) {
      return this.ptr.writeField(200, "i32", value);
    }
    get positionRecoilAmountAiming() {
      return new Vector3(this.ptr.readField(212, "i32"));
    }
    set positionRecoilAmountAiming(value) {
      return this.ptr.writeField(212, "i32", value);
    }
    get recoilRecoverySpeed() {
      return this.ptr.readField(176, "f32").val();
    }
    set recoilRecoverySpeed(value) {
      return this.ptr.writeField(176, "f32", value);
    }
    get rotationDuringJump() {
      return new Vector3(this.ptr.readField(296, "i32"));
    }
    set rotationDuringJump(value) {
      return this.ptr.writeField(296, "i32", value);
    }
    get rotationDuringJumpAndSprint() {
      return new Vector3(this.ptr.readField(308, "i32"));
    }
    set rotationDuringJumpAndSprint(value) {
      return this.ptr.writeField(308, "i32", value);
    }
    get rotationJumpAmount() {
      return new Vector3(this.ptr.readField(260, "i32"));
    }
    set rotationJumpAmount(value) {
      return this.ptr.writeField(260, "i32", value);
    }
    get rotationLandAmount() {
      return new Vector3(this.ptr.readField(332, "i32"));
    }
    set rotationLandAmount(value) {
      return this.ptr.writeField(332, "i32", value);
    }
    get rotationRecoilAmount() {
      return new Vector3(this.ptr.readField(224, "i32"));
    }
    set rotationRecoilAmount(value) {
      return this.ptr.writeField(224, "i32", value);
    }
    get rotationRecoilAmountAiming() {
      return new Vector3(this.ptr.readField(236, "i32"));
    }
    set rotationRecoilAmountAiming(value) {
      return this.ptr.writeField(236, "i32", value);
    }
    get shootShake() {
      return new ShakePreset(this.ptr.readField(180, "i32"));
    }
    set shootShake(value) {
      return this.ptr.writeField(180, "i32", value);
    }
    get shootShakeAim() {
      return new ShakePreset(this.ptr.readField(184, "i32"));
    }
    set shootShakeAim(value) {
      return this.ptr.writeField(184, "i32", value);
    }
    get slidingPosition() {
      return new Vector3(this.ptr.readField(96, "i32"));
    }
    set slidingPosition(value) {
      return this.ptr.writeField(96, "i32", value);
    }
    get slidingRotation() {
      return new Vector3(this.ptr.readField(108, "i32"));
    }
    set slidingRotation(value) {
      return this.ptr.writeField(108, "i32", value);
    }
    get slidingTransitionSpeed() {
      return this.ptr.readField(120, "f32").val();
    }
    set slidingTransitionSpeed(value) {
      return this.ptr.writeField(120, "f32", value);
    }
    get sprintingPosition() {
      return new Vector3(this.ptr.readField(68, "i32"));
    }
    set sprintingPosition(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get sprintingRotation() {
      return new Vector3(this.ptr.readField(80, "i32"));
    }
    set sprintingRotation(value) {
      return this.ptr.writeField(80, "i32", value);
    }
    get sprintingTransitionSpeed() {
      return this.ptr.readField(92, "f32").val();
    }
    set sprintingTransitionSpeed(value) {
      return this.ptr.writeField(92, "f32", value);
    }
  }
  class GameObject {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get active() {
      return window.ctx.call("UnityEngine.GameObject", "get_active", [this.ptr]).val() === 1;
    }
    set active(value) {
      window.ctx.call("UnityEngine.GameObject", "set_active", [this.ptr, value]);
    }
    get activeInHierarchy() {
      return window.ctx.call("UnityEngine.GameObject", "get_activeInHierarchy", [this.ptr]).val() === 1;
    }
    get activeSelf() {
      return window.ctx.call("UnityEngine.GameObject", "get_activeSelf", [this.ptr]).val() === 1;
    }
    get gameObject() {
      return new GameObject(window.ctx.call("UnityEngine.GameObject", "get_gameObject", [this.ptr]));
    }
    get isStatic() {
      return window.ctx.call("UnityEngine.GameObject", "get_isStatic", [this.ptr]).val() === 1;
    }
    set isStatic(value) {
      window.ctx.call("UnityEngine.GameObject", "set_isStatic", [this.ptr, value]);
    }
    get isStaticBatchable() {
      return window.ctx.call("UnityEngine.GameObject", "get_isStaticBatchable", [this.ptr]).val() === 1;
    }
    get layer() {
      return window.ctx.call("UnityEngine.GameObject", "get_layer", [this.ptr]).val();
    }
    set layer(value) {
      window.ctx.call("UnityEngine.GameObject", "set_layer", [this.ptr, value]);
    }
    get scene() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "get_scene", [out, this.ptr]);
        return out;
      })();
    }
    get sceneCullingMask() {
      return window.ctx.call("UnityEngine.GameObject", "get_sceneCullingMask", [this.ptr]).val();
    }
    get tag() {
      return window.ctx.call("UnityEngine.GameObject", "get_tag", [this.ptr]);
    }
    set tag(value) {
      window.ctx.call("UnityEngine.GameObject", "set_tag", [this.ptr, value]);
    }
    get transform() {
      return new Transform(window.ctx.call("UnityEngine.GameObject", "get_transform", [this.ptr]));
    }
    get transformHandle() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "get_transformHandle", [out, this.ptr]);
        return out;
      })();
    }
    AddComponent_componentType(componentType) {
      return new Component(window.ctx.call("UnityEngine.GameObject", "AddComponent_23827", [this.ptr, componentType]));
    }
    AddComponent() {
      return window.ctx.call("UnityEngine.GameObject", "AddComponent", [this.ptr]);
    }
    AddComponentInternal(arg0) {
      return new Component(window.ctx.call("UnityEngine.GameObject", "AddComponentInternal", [this.ptr, arg0]));
    }
    static AddComponentInternal_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "AddComponentInternal_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    BroadcastMessage_methodName_options(methodName, options) {
      window.ctx.call("UnityEngine.GameObject", "BroadcastMessage_23824", [this.ptr, methodName, options]);
    }
    BroadcastMessage_methodName_parameter_options(methodName, parameter, options) {
      window.ctx.call("UnityEngine.GameObject", "BroadcastMessage_23853", [this.ptr, methodName, parameter, options]);
    }
    BroadcastMessage_methodName_parameter(methodName, parameter) {
      window.ctx.call("UnityEngine.GameObject", "BroadcastMessage_23854", [this.ptr, methodName, parameter]);
    }
    BroadcastMessage_methodName(methodName) {
      window.ctx.call("UnityEngine.GameObject", "BroadcastMessage_23855", [this.ptr, methodName]);
    }
    static BroadcastMessage_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.GameObject", "BroadcastMessage_Injected", [arg0, arg1, arg2, arg3]);
    }
    CompareTag_tag(tag) {
      return window.ctx.call("UnityEngine.GameObject", "CompareTag_23841", [this.ptr, tag]).val() === 1;
    }
    CompareTag_tag(tag) {
      return window.ctx.call("UnityEngine.GameObject", "CompareTag_23842", [this.ptr, tag]).val() === 1;
    }
    CompareTagHandle_Internal(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "CompareTagHandle_Internal", [this.ptr, arg0]).val() === 1;
    }
    static CompareTagHandle_Internal_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.GameObject", "CompareTagHandle_Internal_Injected", [arg0, arg1]).val() === 1;
    }
    CompareTag_Internal(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "CompareTag_Internal", [this.ptr, arg0]).val() === 1;
    }
    static CompareTag_Internal_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.GameObject", "CompareTag_Internal_Injected", [arg0, arg1]).val() === 1;
    }
    static CreatePrimitive(arg0) {
      return new GameObject(window.ctx.call("UnityEngine.GameObject", "CreatePrimitive", [arg0]));
    }
    static CreatePrimitive_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "CreatePrimitive_Injected", [out, arg0]);
        return out;
      })();
    }
    static Find(arg0) {
      return new GameObject(window.ctx.call("UnityEngine.GameObject", "Find", [arg0]));
    }
    static FindGameObjectWithTag(arg0) {
      return new GameObject(window.ctx.call("UnityEngine.GameObject", "FindGameObjectWithTag", [arg0]));
    }
    static FindGameObjectWithTag_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "FindGameObjectWithTag_Injected", [out, arg0]);
        return out;
      })();
    }
    static FindGameObjectsWithTag_tag_results(tag, results) {
      window.ctx.call("UnityEngine.GameObject", "FindGameObjectsWithTag_23821", [tag, results]);
    }
    static FindGameObjectsWithTag_tag(tag) {
      return window.ctx.call("UnityEngine.GameObject", "FindGameObjectsWithTag_23846", [tag]);
    }
    static FindGameObjectsWithTagForListInternal(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "FindGameObjectsWithTagForListInternal", [arg0, arg1]);
    }
    static FindGameObjectsWithTagForListInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "FindGameObjectsWithTagForListInternal_Injected", [arg0, arg1]);
    }
    static FindGameObjectsWithTag_Injected(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "FindGameObjectsWithTag_Injected", [arg0]);
    }
    static FindWithTag(arg0) {
      return new GameObject(window.ctx.call("UnityEngine.GameObject", "FindWithTag", [arg0]));
    }
    static Find_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "Find_Injected", [out, arg0]);
        return out;
      })();
    }
    GetComponent() {
      return window.ctx.call("UnityEngine.GameObject", "GetComponent", [this.ptr]);
    }
    GetComponent_type(type) {
      return new Component(window.ctx.call("UnityEngine.GameObject", "GetComponent_23800", [this.ptr, type]));
    }
    GetComponent_type(type) {
      return new Component(window.ctx.call("UnityEngine.GameObject", "GetComponent_23804", [this.ptr, type]));
    }
    GetComponentAtIndex_index(indexValue) {
      return new Component(
        window.ctx.call("UnityEngine.GameObject", "GetComponentAtIndex_23830", [this.ptr, indexValue]),
      );
    }
    GetComponentAtIndex(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentAtIndex", [this.ptr, arg0]);
    }
    GetComponentByName(arg0) {
      return new Component(window.ctx.call("UnityEngine.GameObject", "GetComponentByName", [this.ptr, arg0]));
    }
    GetComponentByNameWithCase(arg0, arg1) {
      return new Component(
        window.ctx.call("UnityEngine.GameObject", "GetComponentByNameWithCase", [this.ptr, arg0, arg1]),
      );
    }
    static GetComponentByNameWithCase_Injected(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "GetComponentByNameWithCase_Injected", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static GetComponentByName_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "GetComponentByName_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    GetComponentCount() {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentCount", [this.ptr]).val();
    }
    static GetComponentCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentCount_Injected", [arg0]).val();
    }
    GetComponentFastPath(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "GetComponentFastPath", [this.ptr, arg0, arg1]);
    }
    static GetComponentFastPath_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.GameObject", "GetComponentFastPath_Injected", [arg0, arg1, arg2]);
    }
    GetComponentInChildren_type_includeInactive(type, includeInactive) {
      return new Component(
        window.ctx.call("UnityEngine.GameObject", "GetComponentInChildren_23805", [this.ptr, type, includeInactive]),
      );
    }
    GetComponentInChildren_type(type) {
      return new Component(window.ctx.call("UnityEngine.GameObject", "GetComponentInChildren_23806", [this.ptr, type]));
    }
    GetComponentInChildren() {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentInChildren", [this.ptr]);
    }
    GetComponentInChildren(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentInChildren", [this.ptr, arg0]);
    }
    static GetComponentInChildren_Injected(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "GetComponentInChildren_Injected", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    GetComponentInParent_type_includeInactive(type, includeInactive) {
      return new Component(
        window.ctx.call("UnityEngine.GameObject", "GetComponentInParent_23807", [this.ptr, type, includeInactive]),
      );
    }
    GetComponentInParent_type(type) {
      return new Component(window.ctx.call("UnityEngine.GameObject", "GetComponentInParent_23808", [this.ptr, type]));
    }
    GetComponentInParent() {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentInParent", [this.ptr]);
    }
    GetComponentInParent(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentInParent", [this.ptr, arg0]);
    }
    static GetComponentInParent_Injected(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "GetComponentInParent_Injected", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    GetComponentIndex(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentIndex", [this.ptr, arg0]).val();
    }
    static GetComponentIndex_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentIndex_Injected", [arg0, arg1]).val();
    }
    static GetComponent_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "GetComponent_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    GetComponents_type(type) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponents_23810", [this.ptr, type]);
    }
    GetComponents() {
      return window.ctx.call("UnityEngine.GameObject", "GetComponents", [this.ptr]);
    }
    GetComponents_type_results(type, results) {
      window.ctx.call("UnityEngine.GameObject", "GetComponents_23811", [this.ptr, type, results]);
    }
    GetComponents(arg0) {
      window.ctx.call("UnityEngine.GameObject", "GetComponents", [this.ptr, arg0]);
    }
    GetComponentsInChildren_type(type) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentsInChildren_23812", [this.ptr, type]);
    }
    GetComponentsInChildren_type_includeInactive(type, includeInactive) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentsInChildren_23813", [
        this.ptr,
        type,
        includeInactive,
      ]);
    }
    GetComponentsInChildren(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentsInChildren", [this.ptr, arg0]);
    }
    GetComponentsInChildren(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "GetComponentsInChildren", [this.ptr, arg0, arg1]);
    }
    GetComponentsInChildren() {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentsInChildren", [this.ptr]);
    }
    GetComponentsInChildren(arg0) {
      window.ctx.call("UnityEngine.GameObject", "GetComponentsInChildren", [this.ptr, arg0]);
    }
    GetComponentsInParent_type(type) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentsInParent_23814", [this.ptr, type]);
    }
    GetComponentsInParent_type_includeInactive(type, includeInactive) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentsInParent_23815", [
        this.ptr,
        type,
        includeInactive,
      ]);
    }
    GetComponentsInParent(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "GetComponentsInParent", [this.ptr, arg0, arg1]);
    }
    GetComponentsInParent(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentsInParent", [this.ptr, arg0]);
    }
    GetComponentsInParent() {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentsInParent", [this.ptr]);
    }
    GetComponentsInternal(arg0, arg1, arg2, arg3, arg4, arg5) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentsInternal", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
      ]);
    }
    static GetComponentsInternal_Injected(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      return window.ctx.call("UnityEngine.GameObject", "GetComponentsInternal_Injected", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
      ]);
    }
    static GetScene_instanceID(instanceID) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "GetScene_23867", [out, instanceID]);
        return out;
      })();
    }
    static GetScene_entityId(entityId) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "GetScene_23869", [out, entityId]);
        return out;
      })();
    }
    static GetSceneInternal(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "GetSceneInternal", [out, arg0]);
        return out;
      })();
    }
    static GetSceneInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "GetSceneInternal_Injected", [arg0, arg1]);
    }
    static InstantiateGameObjects_sourceInstanceID_newInstanceIDs_newTransformInstanceIDs_count_destinationScene(
      sourceInstanceID,
      newInstanceIDs,
      newTransformInstanceIDs,
      count,
      destinationScene,
    ) {
      window.ctx.call("UnityEngine.GameObject", "InstantiateGameObjects_23864", [
        sourceInstanceID,
        newInstanceIDs,
        newTransformInstanceIDs,
        count,
        destinationScene,
      ]);
    }
    static InstantiateGameObjects_sourceInstanceID_count_newInstanceIDs_newTransformInstanceIDs_destinationScene(
      sourceInstanceID,
      count,
      newInstanceIDs,
      newTransformInstanceIDs,
      destinationScene,
    ) {
      window.ctx.call("UnityEngine.GameObject", "InstantiateGameObjects_23865", [
        sourceInstanceID,
        count,
        newInstanceIDs,
        newTransformInstanceIDs,
        destinationScene,
      ]);
    }
    static InstantiateGameObjects_sourceEntityId_count_newEntityIds_newTransformEntityIds_destinationScene(
      sourceEntityId,
      count,
      newEntityIds,
      newTransformEntityIds,
      destinationScene,
    ) {
      window.ctx.call("UnityEngine.GameObject", "InstantiateGameObjects_23866", [
        sourceEntityId,
        count,
        newEntityIds,
        newTransformEntityIds,
        destinationScene,
      ]);
    }
    static InstantiateGameObjects_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.GameObject", "InstantiateGameObjects_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    Internal_AddComponentWithType(arg0) {
      return new Component(
        window.ctx.call("UnityEngine.GameObject", "Internal_AddComponentWithType", [this.ptr, arg0]),
      );
    }
    static Internal_AddComponentWithType_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "Internal_AddComponentWithType_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    static Internal_CreateGameObject(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "Internal_CreateGameObject", [arg0, arg1]);
    }
    static Internal_CreateGameObject_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "Internal_CreateGameObject_Injected", [arg0, arg1]);
    }
    QueryComponentAtIndex(arg0) {
      return new Component(window.ctx.call("UnityEngine.GameObject", "QueryComponentAtIndex", [this.ptr, arg0]));
    }
    static QueryComponentAtIndex_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "QueryComponentAtIndex_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    SendMessage_methodName_options(methodName, options) {
      window.ctx.call("UnityEngine.GameObject", "SendMessage_23823", [this.ptr, methodName, options]);
    }
    SendMessage_methodName_value_options(methodName, value, options) {
      window.ctx.call("UnityEngine.GameObject", "SendMessage_23850", [this.ptr, methodName, value, options]);
    }
    SendMessage_methodName_value(methodName, value) {
      window.ctx.call("UnityEngine.GameObject", "SendMessage_23851", [this.ptr, methodName, value]);
    }
    SendMessage_methodName(methodName) {
      window.ctx.call("UnityEngine.GameObject", "SendMessage_23852", [this.ptr, methodName]);
    }
    SendMessageUpwards_methodName_options(methodName, options) {
      window.ctx.call("UnityEngine.GameObject", "SendMessageUpwards_23822", [this.ptr, methodName, options]);
    }
    SendMessageUpwards_methodName_value_options(methodName, value, options) {
      window.ctx.call("UnityEngine.GameObject", "SendMessageUpwards_23847", [this.ptr, methodName, value, options]);
    }
    SendMessageUpwards_methodName_value(methodName, value) {
      window.ctx.call("UnityEngine.GameObject", "SendMessageUpwards_23848", [this.ptr, methodName, value]);
    }
    SendMessageUpwards_methodName(methodName) {
      window.ctx.call("UnityEngine.GameObject", "SendMessageUpwards_23849", [this.ptr, methodName]);
    }
    static SendMessageUpwards_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.GameObject", "SendMessageUpwards_Injected", [arg0, arg1, arg2, arg3]);
    }
    static SendMessage_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.GameObject", "SendMessage_Injected", [arg0, arg1, arg2, arg3]);
    }
    SetActive(arg0) {
      window.ctx.call("UnityEngine.GameObject", "SetActive", [this.ptr, arg0]);
    }
    SetActiveRecursively(arg0) {
      window.ctx.call("UnityEngine.GameObject", "SetActiveRecursively", [this.ptr, arg0]);
    }
    static SetActiveRecursively_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "SetActiveRecursively_Injected", [arg0, arg1]);
    }
    static SetActive_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "SetActive_Injected", [arg0, arg1]);
    }
    static SetGameObjectsActive_instanceIds_instanceCount_active(instanceIds, instanceCount, active) {
      window.ctx.call("UnityEngine.GameObject", "SetGameObjectsActive_23859", [instanceIds, instanceCount, active]);
    }
    static SetGameObjectsActive_instanceIDs_active(instanceIDs, active) {
      window.ctx.call("UnityEngine.GameObject", "SetGameObjectsActive_23860", [instanceIDs, active]);
    }
    static SetGameObjectsActive_entityIds_active(entityIds, active) {
      window.ctx.call("UnityEngine.GameObject", "SetGameObjectsActive_23861", [entityIds, active]);
    }
    static SetGameObjectsActive_instanceIDs_active(instanceIDs, active) {
      window.ctx.call("UnityEngine.GameObject", "SetGameObjectsActive_23862", [instanceIDs, active]);
    }
    static SetGameObjectsActive_entityIds_active(entityIds, active) {
      window.ctx.call("UnityEngine.GameObject", "SetGameObjectsActive_23863", [entityIds, active]);
    }
    TryGetComponent(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "TryGetComponent", [this.ptr, arg0]).val() === 1;
    }
    TryGetComponent_type_component(type, component) {
      return (
        window.ctx.call("UnityEngine.GameObject", "TryGetComponent_23816", [this.ptr, type, component]).val() === 1
      );
    }
    TryGetComponentFastPath(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "TryGetComponentFastPath", [this.ptr, arg0, arg1]);
    }
    static TryGetComponentFastPath_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.GameObject", "TryGetComponentFastPath_Injected", [arg0, arg1, arg2]);
    }
    TryGetComponentInternal(arg0) {
      return new Component(window.ctx.call("UnityEngine.GameObject", "TryGetComponentInternal", [this.ptr, arg0]));
    }
    static TryGetComponentInternal_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "TryGetComponentInternal_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    static get_activeInHierarchy_Injected(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "get_activeInHierarchy_Injected", [arg0]).val() === 1;
    }
    static get_activeSelf_Injected(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "get_activeSelf_Injected", [arg0]).val() === 1;
    }
    static get_active_Injected(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "get_active_Injected", [arg0]).val() === 1;
    }
    static get_isStaticBatchable_Injected(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "get_isStaticBatchable_Injected", [arg0]).val() === 1;
    }
    static get_isStatic_Injected(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "get_isStatic_Injected", [arg0]).val() === 1;
    }
    static get_layer_Injected(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "get_layer_Injected", [arg0]).val();
    }
    static get_sceneCullingMask_Injected(arg0) {
      return window.ctx.call("UnityEngine.GameObject", "get_sceneCullingMask_Injected", [arg0]).val();
    }
    static get_scene_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "get_scene_Injected", [arg0, arg1]);
    }
    static get_tag_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "get_tag_Injected", [arg0, arg1]);
    }
    static get_transformHandle_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "get_transformHandle_Injected", [arg0, arg1]);
    }
    static get_transform_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.GameObject", "get_transform_Injected", [out, arg0]);
        return out;
      })();
    }
    static set_active_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "set_active_Injected", [arg0, arg1]);
    }
    static set_isStatic_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "set_isStatic_Injected", [arg0, arg1]);
    }
    static set_layer_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "set_layer_Injected", [arg0, arg1]);
    }
    static set_tag_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.GameObject", "set_tag_Injected", [arg0, arg1]);
    }
  }
  class AudioClip {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get ambisonic() {
      return window.ctx.call("UnityEngine.AudioClip", "get_ambisonic", [this.ptr]).val() === 1;
    }
    get channels() {
      return window.ctx.call("UnityEngine.AudioClip", "get_channels", [this.ptr]).val();
    }
    get frequency() {
      return window.ctx.call("UnityEngine.AudioClip", "get_frequency", [this.ptr]).val();
    }
    get isReadyToPlay() {
      return window.ctx.call("UnityEngine.AudioClip", "get_isReadyToPlay", [this.ptr]).val() === 1;
    }
    get length() {
      return window.ctx.call("UnityEngine.AudioClip", "get_length", [this.ptr]).val();
    }
    get loadInBackground() {
      return window.ctx.call("UnityEngine.AudioClip", "get_loadInBackground", [this.ptr]).val() === 1;
    }
    get loadState() {
      return new AudioDataLoadState(window.ctx.call("UnityEngine.AudioClip", "get_loadState", [this.ptr]));
    }
    get loadType() {
      return new AudioClipLoadType(window.ctx.call("UnityEngine.AudioClip", "get_loadType", [this.ptr]));
    }
    get preloadAudioData() {
      return window.ctx.call("UnityEngine.AudioClip", "get_preloadAudioData", [this.ptr]).val() === 1;
    }
    get samples() {
      return window.ctx.call("UnityEngine.AudioClip", "get_samples", [this.ptr]).val();
    }
    get m_PCMReaderCallback() {
      return this.ptr.readField(12, "i32");
    }
    set m_PCMReaderCallback(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get m_PCMSetPositionCallback() {
      return this.ptr.readField(16, "i32");
    }
    set m_PCMSetPositionCallback(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    static Construct_Internal() {
      return new AudioClip(window.ctx.call("UnityEngine.AudioClip", "Construct_Internal", []));
    }
    static Construct_Internal_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AudioClip", "Construct_Internal_Injected", [out]);
        return out;
      })();
    }
    static Create_name_lengthSamples_channels_frequency__3D_stream(arg0, arg1, arg2, arg3, arg4, arg5) {
      return new AudioClip(
        window.ctx.call("UnityEngine.AudioClip", "Create_19699", [arg0, arg1, arg2, arg3, arg4, arg5]),
      );
    }
    static Create_name_lengthSamples_channels_frequency__3D_stream_pcmreadercallback(
      arg0,
      arg1,
      arg2,
      arg3,
      arg4,
      arg5,
      arg6,
    ) {
      return new AudioClip(
        window.ctx.call("UnityEngine.AudioClip", "Create_19700", [arg0, arg1, arg2, arg3, arg4, arg5, arg6]),
      );
    }
    static Create_name_lengthSamples_channels_frequency__3D_stream_pcmreadercallback_pcmsetpositioncallback(
      arg0,
      arg1,
      arg2,
      arg3,
      arg4,
      arg5,
      arg6,
      arg7,
    ) {
      return new AudioClip(
        window.ctx.call("UnityEngine.AudioClip", "Create_19701", [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7]),
      );
    }
    static Create_name_lengthSamples_channels_frequency_stream(name, lengthSamples, channels, frequency, stream) {
      return new AudioClip(
        window.ctx.call("UnityEngine.AudioClip", "Create_19702", [name, lengthSamples, channels, frequency, stream]),
      );
    }
    static Create_name_lengthSamples_channels_frequency_stream_pcmreadercallback(
      name,
      lengthSamples,
      channels,
      frequency,
      stream,
      pcmreadercallback,
    ) {
      return new AudioClip(
        window.ctx.call("UnityEngine.AudioClip", "Create_19703", [
          name,
          lengthSamples,
          channels,
          frequency,
          stream,
          pcmreadercallback,
        ]),
      );
    }
    static Create_name_lengthSamples_channels_frequency_stream_pcmreadercallback_pcmsetpositioncallback(
      name,
      lengthSamples,
      channels,
      frequency,
      stream,
      pcmreadercallback,
      pcmsetpositioncallback,
    ) {
      return new AudioClip(
        window.ctx.call("UnityEngine.AudioClip", "Create_19704", [
          name,
          lengthSamples,
          channels,
          frequency,
          stream,
          pcmreadercallback,
          pcmsetpositioncallback,
        ]),
      );
    }
    CreateUserSound(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.AudioClip", "CreateUserSound", [this.ptr, arg0, arg1, arg2, arg3, arg4]);
    }
    static CreateUserSound_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.AudioClip", "CreateUserSound_Injected", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    static GetData_clip_data_samplesOffset(clip, data, samplesOffset) {
      return window.ctx.call("UnityEngine.AudioClip", "GetData_19678", [clip, data, samplesOffset]).val() === 1;
    }
    GetData_data_offsetSamples(data, offsetSamples) {
      return window.ctx.call("UnityEngine.AudioClip", "GetData_19695", [this.ptr, data, offsetSamples]).val() === 1;
    }
    GetData_data_offsetSamples(data, offsetSamples) {
      return window.ctx.call("UnityEngine.AudioClip", "GetData_19696", [this.ptr, data, offsetSamples]).val() === 1;
    }
    static GetData_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.AudioClip", "GetData_Injected", [arg0, arg1, arg2]).val() === 1;
    }
    GetName() {
      return window.ctx.call("UnityEngine.AudioClip", "GetName", [this.ptr]);
    }
    static GetName_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioClip", "GetName_Injected", [arg0, arg1]);
    }
    InvokePCMReaderCallback_Internal(arg0) {
      window.ctx.call("UnityEngine.AudioClip", "InvokePCMReaderCallback_Internal", [this.ptr, arg0]);
    }
    InvokePCMSetPositionCallback_Internal(arg0) {
      window.ctx.call("UnityEngine.AudioClip", "InvokePCMSetPositionCallback_Internal", [this.ptr, arg0]);
    }
    LoadAudioData() {
      return window.ctx.call("UnityEngine.AudioClip", "LoadAudioData", [this.ptr]).val() === 1;
    }
    static LoadAudioData_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioClip", "LoadAudioData_Injected", [arg0]).val() === 1;
    }
    static SetData_clip_data_samplesOffset(clip, data, samplesOffset) {
      return window.ctx.call("UnityEngine.AudioClip", "SetData_19679", [clip, data, samplesOffset]).val() === 1;
    }
    SetData_data_offsetSamples(data, offsetSamples) {
      return window.ctx.call("UnityEngine.AudioClip", "SetData_19697", [this.ptr, data, offsetSamples]).val() === 1;
    }
    SetData_data_offsetSamples(data, offsetSamples) {
      return window.ctx.call("UnityEngine.AudioClip", "SetData_19698", [this.ptr, data, offsetSamples]).val() === 1;
    }
    static SetData_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.AudioClip", "SetData_Injected", [arg0, arg1, arg2]).val() === 1;
    }
    UnityEngine_Audio_IAudioGenerator_CreateInstance(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AudioClip", "UnityEngine.Audio.IAudioGenerator.CreateInstance", [
          out,
          this.ptr,
          arg0,
          arg1,
          arg2,
        ]);
        return out;
      })();
    }
    UnloadAudioData() {
      return window.ctx.call("UnityEngine.AudioClip", "UnloadAudioData", [this.ptr]).val() === 1;
    }
    static UnloadAudioData_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioClip", "UnloadAudioData_Injected", [arg0]).val() === 1;
    }
    static get_ambisonic_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioClip", "get_ambisonic_Injected", [arg0]).val() === 1;
    }
    static get_channels_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioClip", "get_channels_Injected", [arg0]).val();
    }
    static get_frequency_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioClip", "get_frequency_Injected", [arg0]).val();
    }
    static get_isReadyToPlay_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioClip", "get_isReadyToPlay_Injected", [arg0]).val() === 1;
    }
    static get_length_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioClip", "get_length_Injected", [arg0]).val();
    }
    static get_loadInBackground_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioClip", "get_loadInBackground_Injected", [arg0]).val() === 1;
    }
    static get_loadState_Injected(arg0) {
      return new AudioDataLoadState(window.ctx.call("UnityEngine.AudioClip", "get_loadState_Injected", [arg0]));
    }
    static get_loadType_Injected(arg0) {
      return new AudioClipLoadType(window.ctx.call("UnityEngine.AudioClip", "get_loadType_Injected", [arg0]));
    }
    static get_preloadAudioData_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioClip", "get_preloadAudioData_Injected", [arg0]).val() === 1;
    }
    static get_samples_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioClip", "get_samples_Injected", [arg0]).val();
    }
  }
  class Vector3 {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    static get back() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "get_back", [out]);
        return out;
      })();
    }
    static get down() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "get_down", [out]);
        return out;
      })();
    }
    static get forward() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "get_forward", [out]);
        return out;
      })();
    }
    get Item() {
      return window.ctx.call("UnityEngine.Vector3", "get_Item", [this.ptr, index]).val();
    }
    set Item(value) {
      window.ctx.call("UnityEngine.Vector3", "set_Item", [this.ptr, index, value]);
    }
    static get left() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "get_left", [out]);
        return out;
      })();
    }
    get magnitude() {
      return window.ctx.call("UnityEngine.Vector3", "get_magnitude", [this.ptr]).val();
    }
    get normalized() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "get_normalized", [out, this.ptr]);
        return out;
      })();
    }
    static get one() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "get_one", [out]);
        return out;
      })();
    }
    static get right() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "get_right", [out]);
        return out;
      })();
    }
    get sqrMagnitude() {
      return window.ctx.call("UnityEngine.Vector3", "get_sqrMagnitude", [this.ptr]).val();
    }
    static get up() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "get_up", [out]);
        return out;
      })();
    }
    static get zero() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "get_zero", [out]);
        return out;
      })();
    }
    get backVector() {
      return new Vector3(this.ptr.readField(84, "i32"));
    }
    set backVector(value) {
      return this.ptr.writeField(84, "i32", value);
    }
    get downVector() {
      return new Vector3(this.ptr.readField(36, "i32"));
    }
    set downVector(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get forwardVector() {
      return new Vector3(this.ptr.readField(72, "i32"));
    }
    set forwardVector(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get leftVector() {
      return new Vector3(this.ptr.readField(48, "i32"));
    }
    set leftVector(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    get negativeInfinityVector() {
      return new Vector3(this.ptr.readField(108, "i32"));
    }
    set negativeInfinityVector(value) {
      return this.ptr.writeField(108, "i32", value);
    }
    get oneVector() {
      return new Vector3(this.ptr.readField(12, "i32"));
    }
    set oneVector(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get positiveInfinityVector() {
      return new Vector3(this.ptr.readField(96, "i32"));
    }
    set positiveInfinityVector(value) {
      return this.ptr.writeField(96, "i32", value);
    }
    get rightVector() {
      return new Vector3(this.ptr.readField(60, "i32"));
    }
    set rightVector(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get upVector() {
      return new Vector3(this.ptr.readField(24, "i32"));
    }
    set upVector(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get x() {
      return this.ptr.readField(0, "f32").val();
    }
    set x(value) {
      return this.ptr.writeField(0, "f32", value);
    }
    get y() {
      return this.ptr.readField(4, "f32").val();
    }
    set y(value) {
      return this.ptr.writeField(4, "f32", value);
    }
    get z() {
      return this.ptr.readField(8, "f32").val();
    }
    set z(value) {
      return this.ptr.writeField(8, "f32", value);
    }
    get zeroVector() {
      return new Vector3(this.ptr.readField(0, "i32"));
    }
    set zeroVector(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    static Angle_from_to(from, to) {
      return window.ctx.call("UnityEngine.Vector3", "Angle_23367", [from, to]).val();
    }
    static Angle_from_to(from, to) {
      return window.ctx.call("UnityEngine.Vector3", "Angle_23368", [from, to]).val();
    }
    static ClampMagnitude(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "ClampMagnitude", [out, arg0, arg1]);
        return out;
      })();
    }
    static Cross(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Cross", [out, arg0, arg1]);
        return out;
      })();
    }
    static Distance(arg0, arg1) {
      return window.ctx.call("UnityEngine.Vector3", "Distance", [arg0, arg1]).val();
    }
    static Dot_lhs_rhs(lhs, rhs) {
      return window.ctx.call("UnityEngine.Vector3", "Dot_23363", [lhs, rhs]).val();
    }
    static Dot_lhs_rhs(lhs, rhs) {
      return window.ctx.call("UnityEngine.Vector3", "Dot_23364", [lhs, rhs]).val();
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.Vector3", "Equals_23355", [this.ptr, other]).val() === 1;
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.Vector3", "Equals_23356", [this.ptr, other]).val() === 1;
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.Vector3", "Equals_23357", [this.ptr, other]).val() === 1;
    }
    GetHashCode() {
      return window.ctx.call("UnityEngine.Vector3", "GetHashCode", [this.ptr]).val();
    }
    static Lerp(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Lerp", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static Max_lhs_rhs(lhs, rhs) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Max_23376", [out, lhs, rhs]);
        return out;
      })();
    }
    static Max_lhs_rhs(lhs, rhs) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Max_23377", [out, lhs, rhs]);
        return out;
      })();
    }
    static Min_lhs_rhs(lhs, rhs) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Min_23374", [out, lhs, rhs]);
        return out;
      })();
    }
    static Min_lhs_rhs(lhs, rhs) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Min_23375", [out, lhs, rhs]);
        return out;
      })();
    }
    static MoveTowards(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "MoveTowards", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static Normalize_value(value) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Normalize_23359", [out, value]);
        return out;
      })();
    }
    static Normalize_value(value) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Normalize_23360", [out, value]);
        return out;
      })();
    }
    Normalize_pointer() {
      window.ctx.call("UnityEngine.Vector3", "Normalize_23361", [this.ptr]);
    }
    static Project(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Project", [out, arg0, arg1]);
        return out;
      })();
    }
    static ProjectOnPlane(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "ProjectOnPlane", [out, arg0, arg1]);
        return out;
      })();
    }
    static Reflect(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Reflect", [out, arg0, arg1]);
        return out;
      })();
    }
    static Scale_a_b(a, b) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "Scale_23351", [out, a, b]);
        return out;
      })();
    }
    Scale_scale(scale) {
      window.ctx.call("UnityEngine.Vector3", "Scale_23352", [this.ptr, scale]);
    }
    static SignedAngle(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Vector3", "SignedAngle", [arg0, arg1, arg2]).val();
    }
    static SmoothDamp_current_target_currentVelocity_smoothTime(current, target, currentVelocity, smoothTime) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "SmoothDamp_23345", [out, current, target, currentVelocity, smoothTime]);
        return out;
      })();
    }
    static SmoothDamp_current_target_currentVelocity_smoothTime_maxSpeed_deltaTime(
      current,
      target,
      currentVelocity,
      smoothTime,
      maxSpeed,
      deltaTime,
    ) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Vector3", "SmoothDamp_23346", [
          out,
          current,
          target,
          currentVelocity,
          smoothTime,
          maxSpeed,
          deltaTime,
        ]);
        return out;
      })();
    }
    ToString_pointer() {
      return window.ctx.call("UnityEngine.Vector3", "ToString_23394", [this.ptr]);
    }
    ToString_format_formatProvider(format, formatProvider) {
      return window.ctx.call("UnityEngine.Vector3", "ToString_23395", [this.ptr, format, formatProvider]);
    }
  }
  class MuzzleFlash {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get aimScaleMulti() {
      return this.ptr.readField(48, "f32").val();
    }
    set aimScaleMulti(value) {
      return this.ptr.writeField(48, "f32", value);
    }
    get bulletsParticleSystem() {
      return new ParticleSystemExtension(this.ptr.readField(32, "i32"));
    }
    set bulletsParticleSystem(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get lifeTime() {
      return this.ptr.readField(40, "f32").val();
    }
    set lifeTime(value) {
      return this.ptr.writeField(40, "f32", value);
    }
    get mode() {
      return new MuzzleFlashMode(this.ptr.readField(16, "i32"));
    }
    set mode(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get myParticleSystem() {
      return new ParticleSystem(this.ptr.readField(20, "i32"));
    }
    set myParticleSystem(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get originalScale() {
      return new Vector3(this.ptr.readField(52, "i32"));
    }
    set originalScale(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get playParticlesFor() {
      return this.ptr.readField(36, "f32").val();
    }
    set playParticlesFor(value) {
      return this.ptr.writeField(36, "f32", value);
    }
    get randomZRotation() {
      return this.ptr.readField(24, "f32").val();
    }
    set randomZRotation(value) {
      return this.ptr.writeField(24, "f32", value);
    }
    get recursiveChildLookup() {
      return this.ptr.readField(28, "i32").val() === 1;
    }
    set recursiveChildLookup(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get setRandomRotation() {
      return this.ptr.readField(44, "i32").val() === 1;
    }
    set setRandomRotation(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get stopBulletsCoroutine() {
      return new Coroutine(this.ptr.readField(64, "i32"));
    }
    set stopBulletsCoroutine(value) {
      return this.ptr.writeField(64, "i32", value);
    }
    ApplyScale() {
      window.ctx.call("MuzzleFlash", "ApplyScale", [this.ptr]);
    }
    Hide() {
      window.ctx.call("MuzzleFlash", "Hide", [this.ptr]);
    }
    IenuStopBullets() {
      return window.ctx.call("MuzzleFlash", "IenuStopBullets", [this.ptr]);
    }
    OnEnable() {
      window.ctx.call("MuzzleFlash", "OnEnable", [this.ptr]);
    }
    Play(arg0) {
      window.ctx.call("MuzzleFlash", "Play", [this.ptr, arg0]);
    }
    PlayParticleSystemMode(arg0) {
      window.ctx.call("MuzzleFlash", "PlayParticleSystemMode", [this.ptr, arg0]);
    }
    Show(arg0) {
      window.ctx.call("MuzzleFlash", "Show", [this.ptr, arg0]);
    }
  }
  class GunSkin {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get forGun() {
      return this.ptr.readField(56, "i32").val();
    }
    set forGun(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get isPrefab() {
      return this.ptr.readField(50, "i32").val() === 1;
    }
    set isPrefab(value) {
      return this.ptr.writeField(50, "i32", value);
    }
    get material() {
      return this.ptr.readField(60, "i32").val();
    }
    set material(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get texturePath() {
      return this.ptr.readField(52, "i32").mstr();
    }
    set texturePath(value) {
      return this.ptr.writeField(52, "i32", window.ctx.createMstr(value));
    }
    GetDefaultIdTypeBased() {
      return window.ctx.call("GunSkin", "GetDefaultIdTypeBased", [this.ptr]).val();
    }
    IsDefaultItem() {
      return window.ctx.call("GunSkin", "IsDefaultItem", [this.ptr]).val() === 1;
    }
    IsSelected() {
      return window.ctx.call("GunSkin", "IsSelected", [this.ptr]).val() === 1;
    }
    ToString() {
      return window.ctx.call("GunSkin", "ToString", [this.ptr]);
    }
  }
  class MyTextureLoader {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get instantiatedPrefab() {
      return new GameObject(this.ptr.readField(52, "i32"));
    }
    set instantiatedPrefab(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get isFallbackPrefab() {
      return this.ptr.readField(60, "i32").val() === 1;
    }
    set isFallbackPrefab(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get loadTextureOnEnableFallback() {
      return this.ptr.readField(56, "i32").mstr();
    }
    set loadTextureOnEnableFallback(value) {
      return this.ptr.writeField(56, "i32", window.ctx.createMstr(value));
    }
    get loaded() {
      return this.ptr.readField(16, "i32").val() === 1;
    }
    set loaded(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get materials() {
      return JSArray(this.ptr.readField(24, "i32"));
    }
    set materials(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get meshRenderers() {
      return JSArray(this.ptr.readField(20, "i32"));
    }
    set meshRenderers(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get prefabHandle() {
      return new GameObject(this.ptr.readField(40, "i32"));
    }
    set prefabHandle(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get textureHandle() {
      return new Texture(this.ptr.readField(28, "i32"));
    }
    set textureHandle(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    OnDestroy() {
      window.ctx.call("MyTextureLoader", "OnDestroy", [this.ptr]);
    }
    OnEnable() {
      window.ctx.call("MyTextureLoader", "OnEnable", [this.ptr]);
    }
    SetLayerRecursively(arg0, arg1) {
      window.ctx.call("MyTextureLoader", "SetLayerRecursively", [this.ptr, arg0, arg1]);
    }
    TryLoadAndSetTexture(arg0, arg1, arg2, arg3) {
      window.ctx.call("MyTextureLoader", "TryLoadAndSetTexture", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    TryLoadAndSetTextureAsync(arg0, arg1, arg2, arg3) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("MyTextureLoader", "TryLoadAndSetTextureAsync", [out, this.ptr, arg0, arg1, arg2, arg3]);
        return out;
      })();
    }
  }
  class GunRarity {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class AudioSource {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get bypassEffects() {
      return window.ctx.call("UnityEngine.AudioSource", "get_bypassEffects", [this.ptr]).val() === 1;
    }
    set bypassEffects(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_bypassEffects", [this.ptr, value]);
    }
    get bypassListenerEffects() {
      return window.ctx.call("UnityEngine.AudioSource", "get_bypassListenerEffects", [this.ptr]).val() === 1;
    }
    set bypassListenerEffects(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_bypassListenerEffects", [this.ptr, value]);
    }
    get bypassReverbZones() {
      return window.ctx.call("UnityEngine.AudioSource", "get_bypassReverbZones", [this.ptr]).val() === 1;
    }
    set bypassReverbZones(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_bypassReverbZones", [this.ptr, value]);
    }
    get clip() {
      return new AudioClip(window.ctx.call("UnityEngine.AudioSource", "get_clip", [this.ptr]));
    }
    set clip(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_clip", [this.ptr, value]);
    }
    get containerActivePlayables() {
      return window.ctx.call("UnityEngine.AudioSource", "get_containerActivePlayables", [this.ptr]);
    }
    get dopplerLevel() {
      return window.ctx.call("UnityEngine.AudioSource", "get_dopplerLevel", [this.ptr]).val();
    }
    set dopplerLevel(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_dopplerLevel", [this.ptr, value]);
    }
    get generator() {
      return new IAudioGenerator(window.ctx.call("UnityEngine.AudioSource", "get_generator", [this.ptr]));
    }
    set generator(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_generator", [this.ptr, value]);
    }
    get generatorDefinition() {
      return new IAudioGenerator(window.ctx.call("UnityEngine.AudioSource", "get_generatorDefinition", [this.ptr]));
    }
    set generatorDefinition(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_generatorDefinition", [this.ptr, value]);
    }
    get generatorHandle() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AudioSource", "get_generatorHandle", [out, this.ptr]);
        return out;
      })();
    }
    get generatorHeader() {
      return window.ctx.call("UnityEngine.AudioSource", "get_generatorHeader", [this.ptr]);
    }
    get generatorInstance() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AudioSource", "get_generatorInstance", [out, this.ptr]);
        return out;
      })();
    }
    get generatorObject() {
      return new UnityObject(window.ctx.call("UnityEngine.AudioSource", "get_generatorObject", [this.ptr]));
    }
    set generatorObject(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_generatorObject", [this.ptr, value]);
    }
    get ignoreListenerPause() {
      return window.ctx.call("UnityEngine.AudioSource", "get_ignoreListenerPause", [this.ptr]).val() === 1;
    }
    set ignoreListenerPause(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_ignoreListenerPause", [this.ptr, value]);
    }
    get ignoreListenerVolume() {
      return window.ctx.call("UnityEngine.AudioSource", "get_ignoreListenerVolume", [this.ptr]).val() === 1;
    }
    set ignoreListenerVolume(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_ignoreListenerVolume", [this.ptr, value]);
    }
    get isContainerPlaying() {
      return window.ctx.call("UnityEngine.AudioSource", "get_isContainerPlaying", [this.ptr]).val() === 1;
    }
    get isPlaying() {
      return window.ctx.call("UnityEngine.AudioSource", "get_isPlaying", [this.ptr]).val() === 1;
    }
    get isVirtual() {
      return window.ctx.call("UnityEngine.AudioSource", "get_isVirtual", [this.ptr]).val() === 1;
    }
    get loop() {
      return window.ctx.call("UnityEngine.AudioSource", "get_loop", [this.ptr]).val() === 1;
    }
    set loop(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_loop", [this.ptr, value]);
    }
    get maxDistance() {
      return window.ctx.call("UnityEngine.AudioSource", "get_maxDistance", [this.ptr]).val();
    }
    set maxDistance(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_maxDistance", [this.ptr, value]);
    }
    get maxVolume() {
      return window.ctx.call("UnityEngine.AudioSource", "get_maxVolume", [this.ptr]).val();
    }
    set maxVolume(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_maxVolume", [this.ptr, value]);
    }
    get minDistance() {
      return window.ctx.call("UnityEngine.AudioSource", "get_minDistance", [this.ptr]).val();
    }
    set minDistance(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_minDistance", [this.ptr, value]);
    }
    get minVolume() {
      return window.ctx.call("UnityEngine.AudioSource", "get_minVolume", [this.ptr]).val();
    }
    set minVolume(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_minVolume", [this.ptr, value]);
    }
    get mute() {
      return window.ctx.call("UnityEngine.AudioSource", "get_mute", [this.ptr]).val() === 1;
    }
    set mute(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_mute", [this.ptr, value]);
    }
    get outputAudioMixerGroup() {
      return window.ctx.call("UnityEngine.AudioSource", "get_outputAudioMixerGroup", [this.ptr]);
    }
    set outputAudioMixerGroup(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_outputAudioMixerGroup", [this.ptr, value]);
    }
    get panStereo() {
      return window.ctx.call("UnityEngine.AudioSource", "get_panStereo", [this.ptr]).val();
    }
    set panStereo(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_panStereo", [this.ptr, value]);
    }
    get pitch() {
      return window.ctx.call("UnityEngine.AudioSource", "get_pitch", [this.ptr]).val();
    }
    set pitch(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_pitch", [this.ptr, value]);
    }
    get playOnAwake() {
      return window.ctx.call("UnityEngine.AudioSource", "get_playOnAwake", [this.ptr]).val() === 1;
    }
    set playOnAwake(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_playOnAwake", [this.ptr, value]);
    }
    get priority() {
      return window.ctx.call("UnityEngine.AudioSource", "get_priority", [this.ptr]).val();
    }
    set priority(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_priority", [this.ptr, value]);
    }
    get resource() {
      return window.ctx.call("UnityEngine.AudioSource", "get_resource", [this.ptr]);
    }
    set resource(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_resource", [this.ptr, value]);
    }
    get reverbZoneMix() {
      return window.ctx.call("UnityEngine.AudioSource", "get_reverbZoneMix", [this.ptr]).val();
    }
    set reverbZoneMix(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_reverbZoneMix", [this.ptr, value]);
    }
    get rolloffFactor() {
      return window.ctx.call("UnityEngine.AudioSource", "get_rolloffFactor", [this.ptr]).val();
    }
    set rolloffFactor(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_rolloffFactor", [this.ptr, value]);
    }
    get rolloffMode() {
      return new AudioSourceRolloffMode(window.ctx.call("UnityEngine.AudioSource", "get_rolloffMode", [this.ptr]));
    }
    set rolloffMode(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_rolloffMode", [this.ptr, value]);
    }
    get spatialBlend() {
      return window.ctx.call("UnityEngine.AudioSource", "get_spatialBlend", [this.ptr]).val();
    }
    set spatialBlend(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_spatialBlend", [this.ptr, value]);
    }
    get spatialize() {
      return window.ctx.call("UnityEngine.AudioSource", "get_spatialize", [this.ptr]).val() === 1;
    }
    set spatialize(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_spatialize", [this.ptr, value]);
    }
    get spatializePostEffects() {
      return window.ctx.call("UnityEngine.AudioSource", "get_spatializePostEffects", [this.ptr]).val() === 1;
    }
    set spatializePostEffects(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_spatializePostEffects", [this.ptr, value]);
    }
    get spread() {
      return window.ctx.call("UnityEngine.AudioSource", "get_spread", [this.ptr]).val();
    }
    set spread(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_spread", [this.ptr, value]);
    }
    get time() {
      return window.ctx.call("UnityEngine.AudioSource", "get_time", [this.ptr]).val();
    }
    set time(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_time", [this.ptr, value]);
    }
    get timeSamples() {
      return window.ctx.call("UnityEngine.AudioSource", "get_timeSamples", [this.ptr]).val();
    }
    set timeSamples(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_timeSamples", [this.ptr, value]);
    }
    get velocityUpdateMode() {
      return new AudioSourceVelocityUpdateMode(
        window.ctx.call("UnityEngine.AudioSource", "get_velocityUpdateMode", [this.ptr]),
      );
    }
    set velocityUpdateMode(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_velocityUpdateMode", [this.ptr, value]);
    }
    get volume() {
      return window.ctx.call("UnityEngine.AudioSource", "get_volume", [this.ptr]).val();
    }
    set volume(value) {
      window.ctx.call("UnityEngine.AudioSource", "set_volume", [this.ptr, value]);
    }
    GetAmbisonicDecoderFloat(arg0, arg1) {
      return window.ctx.call("UnityEngine.AudioSource", "GetAmbisonicDecoderFloat", [this.ptr, arg0, arg1]).val() === 1;
    }
    static GetAmbisonicDecoderFloat_Injected(arg0, arg1, arg2) {
      return (
        window.ctx.call("UnityEngine.AudioSource", "GetAmbisonicDecoderFloat_Injected", [arg0, arg1, arg2]).val() === 1
      );
    }
    GetAudioRandomContainerRuntimeMeterValue() {
      return window.ctx.call("UnityEngine.AudioSource", "GetAudioRandomContainerRuntimeMeterValue", [this.ptr]).val();
    }
    static GetAudioRandomContainerRuntimeMeterValue_Injected(arg0) {
      return window.ctx
        .call("UnityEngine.AudioSource", "GetAudioRandomContainerRuntimeMeterValue_Injected", [arg0])
        .val();
    }
    GetCustomCurve(arg0) {
      return new AnimationCurve(window.ctx.call("UnityEngine.AudioSource", "GetCustomCurve", [this.ptr, arg0]));
    }
    static GetCustomCurveHelper(arg0, arg1) {
      return new AnimationCurve(window.ctx.call("UnityEngine.AudioSource", "GetCustomCurveHelper", [arg0, arg1]));
    }
    static GetCustomCurveHelper_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AudioSource", "GetCustomCurveHelper_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    GetOutputData_numSamples_channel(numSamples, channel) {
      return window.ctx.call("UnityEngine.AudioSource", "GetOutputData_19838", [this.ptr, numSamples, channel]);
    }
    GetOutputData_samples_channel(samples, channel) {
      window.ctx.call("UnityEngine.AudioSource", "GetOutputData_19839", [this.ptr, samples, channel]);
    }
    static GetOutputDataHelper(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.AudioSource", "GetOutputDataHelper", [arg0, arg1, arg2]);
    }
    static GetOutputDataHelper_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.AudioSource", "GetOutputDataHelper_Injected", [arg0, arg1, arg2]);
    }
    static GetPitch(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "GetPitch", [arg0]).val();
    }
    static GetPitch_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "GetPitch_Injected", [arg0]).val();
    }
    GetSpatializerFloat(arg0, arg1) {
      return window.ctx.call("UnityEngine.AudioSource", "GetSpatializerFloat", [this.ptr, arg0, arg1]).val() === 1;
    }
    static GetSpatializerFloat_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.AudioSource", "GetSpatializerFloat_Injected", [arg0, arg1, arg2]).val() === 1;
    }
    GetSpectrumData_numSamples_channel_window_safe(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.AudioSource", "GetSpectrumData_19840", [this.ptr, arg0, arg1, arg2]);
    }
    GetSpectrumData_samples_channel_window_safe(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.AudioSource", "GetSpectrumData_19841", [this.ptr, arg0, arg1, arg2]);
    }
    static GetSpectrumDataHelper(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.AudioSource", "GetSpectrumDataHelper", [arg0, arg1, arg2, arg3]);
    }
    static GetSpectrumDataHelper_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.AudioSource", "GetSpectrumDataHelper_Injected", [arg0, arg1, arg2, arg3]);
    }
    Pause() {
      window.ctx.call("UnityEngine.AudioSource", "Pause", [this.ptr]);
    }
    static Pause_Injected(arg0) {
      window.ctx.call("UnityEngine.AudioSource", "Pause_Injected", [arg0]);
    }
    Play_delay(delay) {
      window.ctx.call("UnityEngine.AudioSource", "Play_19756", [this.ptr, delay]);
    }
    Play_pointer() {
      window.ctx.call("UnityEngine.AudioSource", "Play_19780", [this.ptr]);
    }
    Play_delay(delay) {
      window.ctx.call("UnityEngine.AudioSource", "Play_19781", [this.ptr, delay]);
    }
    static PlayClipAtPoint_clip_position(clip, position) {
      window.ctx.call("UnityEngine.AudioSource", "PlayClipAtPoint_19796", [clip, position]);
    }
    static PlayClipAtPoint_clip_position_volume(clip, position, volume) {
      window.ctx.call("UnityEngine.AudioSource", "PlayClipAtPoint_19797", [clip, position, volume]);
    }
    PlayDelayed(arg0) {
      window.ctx.call("UnityEngine.AudioSource", "PlayDelayed", [this.ptr, arg0]);
    }
    static PlayHelper(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "PlayHelper", [arg0, arg1]);
    }
    static PlayHelper_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "PlayHelper_Injected", [arg0, arg1]);
    }
    PlayOneShot_clip(clip) {
      window.ctx.call("UnityEngine.AudioSource", "PlayOneShot_19784", [this.ptr, clip]);
    }
    PlayOneShot_clip_volumeScale(clip, volumeScale) {
      window.ctx.call("UnityEngine.AudioSource", "PlayOneShot_19785", [this.ptr, clip, volumeScale]);
    }
    static PlayOneShotHelper(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.AudioSource", "PlayOneShotHelper", [arg0, arg1, arg2]);
    }
    static PlayOneShotHelper_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.AudioSource", "PlayOneShotHelper_Injected", [arg0, arg1, arg2]);
    }
    PlayScheduled(arg0) {
      window.ctx.call("UnityEngine.AudioSource", "PlayScheduled", [this.ptr, arg0]);
    }
    static Play_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "Play_Injected", [arg0, arg1]);
    }
    SetAmbisonicDecoderFloat(arg0, arg1) {
      return window.ctx.call("UnityEngine.AudioSource", "SetAmbisonicDecoderFloat", [this.ptr, arg0, arg1]).val() === 1;
    }
    static SetAmbisonicDecoderFloat_Injected(arg0, arg1, arg2) {
      return (
        window.ctx.call("UnityEngine.AudioSource", "SetAmbisonicDecoderFloat_Injected", [arg0, arg1, arg2]).val() === 1
      );
    }
    SetCustomCurve(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "SetCustomCurve", [this.ptr, arg0, arg1]);
    }
    static SetCustomCurveHelper(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.AudioSource", "SetCustomCurveHelper", [arg0, arg1, arg2]);
    }
    static SetCustomCurveHelper_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.AudioSource", "SetCustomCurveHelper_Injected", [arg0, arg1, arg2]);
    }
    static SetPitch(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "SetPitch", [arg0, arg1]);
    }
    static SetPitch_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "SetPitch_Injected", [arg0, arg1]);
    }
    SetScheduledEndTime(arg0) {
      window.ctx.call("UnityEngine.AudioSource", "SetScheduledEndTime", [this.ptr, arg0]);
    }
    static SetScheduledEndTime_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "SetScheduledEndTime_Injected", [arg0, arg1]);
    }
    SetScheduledStartTime(arg0) {
      window.ctx.call("UnityEngine.AudioSource", "SetScheduledStartTime", [this.ptr, arg0]);
    }
    static SetScheduledStartTime_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "SetScheduledStartTime_Injected", [arg0, arg1]);
    }
    SetSpatializerFloat(arg0, arg1) {
      return window.ctx.call("UnityEngine.AudioSource", "SetSpatializerFloat", [this.ptr, arg0, arg1]).val() === 1;
    }
    static SetSpatializerFloat_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.AudioSource", "SetSpatializerFloat_Injected", [arg0, arg1, arg2]).val() === 1;
    }
    SkipToNextElementIfHasContainer() {
      window.ctx.call("UnityEngine.AudioSource", "SkipToNextElementIfHasContainer", [this.ptr]);
    }
    static SkipToNextElementIfHasContainer_Injected(arg0) {
      window.ctx.call("UnityEngine.AudioSource", "SkipToNextElementIfHasContainer_Injected", [arg0]);
    }
    Stop_stopOneShots(stopOneShots) {
      window.ctx.call("UnityEngine.AudioSource", "Stop_19758", [this.ptr, stopOneShots]);
    }
    Stop_pointer() {
      window.ctx.call("UnityEngine.AudioSource", "Stop_19788", [this.ptr]);
    }
    static Stop_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "Stop_Injected", [arg0, arg1]);
    }
    UnPause() {
      window.ctx.call("UnityEngine.AudioSource", "UnPause", [this.ptr]);
    }
    static UnPause_Injected(arg0) {
      window.ctx.call("UnityEngine.AudioSource", "UnPause_Injected", [arg0]);
    }
    static get_bypassEffects_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_bypassEffects_Injected", [arg0]).val() === 1;
    }
    static get_bypassListenerEffects_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_bypassListenerEffects_Injected", [arg0]).val() === 1;
    }
    static get_bypassReverbZones_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_bypassReverbZones_Injected", [arg0]).val() === 1;
    }
    static get_containerActivePlayables_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_containerActivePlayables_Injected", [arg0]);
    }
    static get_dopplerLevel_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_dopplerLevel_Injected", [arg0]).val();
    }
    static get_generatorHeader_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_generatorHeader_Injected", [arg0]);
    }
    static get_generatorObject_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AudioSource", "get_generatorObject_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_ignoreListenerPause_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_ignoreListenerPause_Injected", [arg0]).val() === 1;
    }
    static get_ignoreListenerVolume_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_ignoreListenerVolume_Injected", [arg0]).val() === 1;
    }
    static get_isContainerPlaying_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_isContainerPlaying_Injected", [arg0]).val() === 1;
    }
    static get_isPlaying_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_isPlaying_Injected", [arg0]).val() === 1;
    }
    static get_isVirtual_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_isVirtual_Injected", [arg0]).val() === 1;
    }
    static get_loop_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_loop_Injected", [arg0]).val() === 1;
    }
    static get_maxDistance_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_maxDistance_Injected", [arg0]).val();
    }
    static get_minDistance_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_minDistance_Injected", [arg0]).val();
    }
    static get_mute_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_mute_Injected", [arg0]).val() === 1;
    }
    static get_outputAudioMixerGroup_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AudioSource", "get_outputAudioMixerGroup_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_panStereo_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_panStereo_Injected", [arg0]).val();
    }
    static get_playOnAwake_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_playOnAwake_Injected", [arg0]).val() === 1;
    }
    static get_priority_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_priority_Injected", [arg0]).val();
    }
    static get_reverbZoneMix_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_reverbZoneMix_Injected", [arg0]).val();
    }
    static get_rolloffMode_Injected(arg0) {
      return new AudioSourceRolloffMode(window.ctx.call("UnityEngine.AudioSource", "get_rolloffMode_Injected", [arg0]));
    }
    static get_spatialBlend_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_spatialBlend_Injected", [arg0]).val();
    }
    static get_spatializePostEffects_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_spatializePostEffects_Injected", [arg0]).val() === 1;
    }
    static get_spatialize_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_spatialize_Injected", [arg0]).val() === 1;
    }
    static get_spread_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_spread_Injected", [arg0]).val();
    }
    static get_timeSamples_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_timeSamples_Injected", [arg0]).val();
    }
    static get_time_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_time_Injected", [arg0]).val();
    }
    static get_velocityUpdateMode_Injected(arg0) {
      return new AudioSourceVelocityUpdateMode(
        window.ctx.call("UnityEngine.AudioSource", "get_velocityUpdateMode_Injected", [arg0]),
      );
    }
    static get_volume_Injected(arg0) {
      return window.ctx.call("UnityEngine.AudioSource", "get_volume_Injected", [arg0]).val();
    }
    static set_bypassEffects_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_bypassEffects_Injected", [arg0, arg1]);
    }
    static set_bypassListenerEffects_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_bypassListenerEffects_Injected", [arg0, arg1]);
    }
    static set_bypassReverbZones_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_bypassReverbZones_Injected", [arg0, arg1]);
    }
    static set_dopplerLevel_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_dopplerLevel_Injected", [arg0, arg1]);
    }
    static set_generatorObject_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_generatorObject_Injected", [arg0, arg1]);
    }
    static set_ignoreListenerPause_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_ignoreListenerPause_Injected", [arg0, arg1]);
    }
    static set_ignoreListenerVolume_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_ignoreListenerVolume_Injected", [arg0, arg1]);
    }
    static set_loop_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_loop_Injected", [arg0, arg1]);
    }
    static set_maxDistance_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_maxDistance_Injected", [arg0, arg1]);
    }
    static set_minDistance_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_minDistance_Injected", [arg0, arg1]);
    }
    static set_mute_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_mute_Injected", [arg0, arg1]);
    }
    static set_outputAudioMixerGroup_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_outputAudioMixerGroup_Injected", [arg0, arg1]);
    }
    static set_panStereo_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_panStereo_Injected", [arg0, arg1]);
    }
    static set_playOnAwake_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_playOnAwake_Injected", [arg0, arg1]);
    }
    static set_priority_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_priority_Injected", [arg0, arg1]);
    }
    static set_reverbZoneMix_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_reverbZoneMix_Injected", [arg0, arg1]);
    }
    static set_rolloffMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_rolloffMode_Injected", [arg0, arg1]);
    }
    static set_spatialBlend_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_spatialBlend_Injected", [arg0, arg1]);
    }
    static set_spatializePostEffects_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_spatializePostEffects_Injected", [arg0, arg1]);
    }
    static set_spatialize_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_spatialize_Injected", [arg0, arg1]);
    }
    static set_spread_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_spread_Injected", [arg0, arg1]);
    }
    static set_timeSamples_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_timeSamples_Injected", [arg0, arg1]);
    }
    static set_time_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_time_Injected", [arg0, arg1]);
    }
    static set_velocityUpdateMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_velocityUpdateMode_Injected", [arg0, arg1]);
    }
    static set_volume_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AudioSource", "set_volume_Injected", [arg0, arg1]);
    }
  }
  class Tween {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get active() {
      return window.ctx.call("DG.Tweening.Tween", "get_active", [this.ptr]).val() === 1;
    }
    set active(value) {
      window.ctx.call("DG.Tweening.Tween", "set_active", [this.ptr, value]);
    }
    get fullPosition() {
      return window.ctx.call("DG.Tweening.Tween", "get_fullPosition", [this.ptr]).val();
    }
    set fullPosition(value) {
      window.ctx.call("DG.Tweening.Tween", "set_fullPosition", [this.ptr, value]);
    }
    get hasLoops() {
      return window.ctx.call("DG.Tweening.Tween", "get_hasLoops", [this.ptr]).val() === 1;
    }
    get isRelative() {
      return window.ctx.call("DG.Tweening.Tween", "get_isRelative", [this.ptr]).val() === 1;
    }
    set isRelative(value) {
      window.ctx.call("DG.Tweening.Tween", "set_isRelative", [this.ptr, value]);
    }
    get playedOnce() {
      return window.ctx.call("DG.Tweening.Tween", "get_playedOnce", [this.ptr]).val() === 1;
    }
    set playedOnce(value) {
      window.ctx.call("DG.Tweening.Tween", "set_playedOnce", [this.ptr, value]);
    }
    get position() {
      return window.ctx.call("DG.Tweening.Tween", "get_position", [this.ptr]).val();
    }
    set position(value) {
      window.ctx.call("DG.Tweening.Tween", "set_position", [this.ptr, value]);
    }
    get _active_k_BackingField() {
      return this.ptr.readField(148, "i32").val() === 1;
    }
    set _active_k_BackingField(value) {
      return this.ptr.writeField(148, "i32", value);
    }
    get _isRelative_k_BackingField() {
      return this.ptr.readField(112, "i32").val() === 1;
    }
    set _isRelative_k_BackingField(value) {
      return this.ptr.writeField(112, "i32", value);
    }
    get _playedOnce_k_BackingField() {
      return this.ptr.readField(166, "i32").val() === 1;
    }
    set _playedOnce_k_BackingField(value) {
      return this.ptr.writeField(166, "i32", value);
    }
    get _position_k_BackingField() {
      return this.ptr.readField(168, "f32").val();
    }
    set _position_k_BackingField(value) {
      return this.ptr.writeField(168, "f32", value);
    }
    get activeId() {
      return this.ptr.readField(156, "i32").val();
    }
    set activeId(value) {
      return this.ptr.writeField(156, "i32", value);
    }
    get autoKill() {
      return this.ptr.readField(92, "i32").val() === 1;
    }
    set autoKill(value) {
      return this.ptr.writeField(92, "i32", value);
    }
    get completedLoops() {
      return this.ptr.readField(176, "i32").val();
    }
    set completedLoops(value) {
      return this.ptr.writeField(176, "i32", value);
    }
    get creationLocked() {
      return this.ptr.readField(164, "i32").val() === 1;
    }
    set creationLocked(value) {
      return this.ptr.writeField(164, "i32", value);
    }
    get customEase() {
      return new EaseFunction(this.ptr.readField(120, "i32"));
    }
    set customEase(value) {
      return this.ptr.writeField(120, "i32", value);
    }
    get debugTargetId() {
      return this.ptr.readField(132, "i32").mstr();
    }
    set debugTargetId(value) {
      return this.ptr.writeField(132, "i32", window.ctx.createMstr(value));
    }
    get delay() {
      return this.ptr.readField(108, "f32").val();
    }
    set delay(value) {
      return this.ptr.writeField(108, "f32", value);
    }
    get delayComplete() {
      return this.ptr.readField(188, "i32").val() === 1;
    }
    set delayComplete(value) {
      return this.ptr.writeField(188, "i32", value);
    }
    get duration() {
      return this.ptr.readField(96, "f32").val();
    }
    set duration(value) {
      return this.ptr.writeField(96, "f32", value);
    }
    get easeOvershootOrAmplitude() {
      return this.ptr.readField(124, "f32").val();
    }
    set easeOvershootOrAmplitude(value) {
      return this.ptr.writeField(124, "f32", value);
    }
    get easePeriod() {
      return this.ptr.readField(128, "f32").val();
    }
    set easePeriod(value) {
      return this.ptr.writeField(128, "f32", value);
    }
    get easeType() {
      return new Ease(this.ptr.readField(116, "i32"));
    }
    set easeType(value) {
      return this.ptr.writeField(116, "i32", value);
    }
    get elapsedDelay() {
      return this.ptr.readField(184, "f32").val();
    }
    set elapsedDelay(value) {
      return this.ptr.writeField(184, "f32", value);
    }
    get fullDuration() {
      return this.ptr.readField(172, "f32").val();
    }
    set fullDuration(value) {
      return this.ptr.writeField(172, "f32", value);
    }
    get id() {
      return new UnityObject(this.ptr.readField(32, "i32"));
    }
    set id(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get intId() {
      return this.ptr.readField(40, "i32").val();
    }
    set intId(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get isBackwards() {
      return this.ptr.readField(28, "i32").val() === 1;
    }
    set isBackwards(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get isBlendable() {
      return this.ptr.readField(89, "i32").val() === 1;
    }
    set isBlendable(value) {
      return this.ptr.writeField(89, "i32", value);
    }
    get isComplete() {
      return this.ptr.readField(181, "i32").val() === 1;
    }
    set isComplete(value) {
      return this.ptr.writeField(181, "i32", value);
    }
    get isFrom() {
      return this.ptr.readField(88, "i32").val() === 1;
    }
    set isFrom(value) {
      return this.ptr.writeField(88, "i32", value);
    }
    get isIndependentUpdate() {
      return this.ptr.readField(52, "i32").val() === 1;
    }
    set isIndependentUpdate(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get isInverted() {
      return this.ptr.readField(29, "i32").val() === 1;
    }
    set isInverted(value) {
      return this.ptr.writeField(29, "i32", value);
    }
    get isPlaying() {
      return this.ptr.readField(180, "i32").val() === 1;
    }
    set isPlaying(value) {
      return this.ptr.writeField(180, "i32", value);
    }
    get isRecyclable() {
      return this.ptr.readField(90, "i32").val() === 1;
    }
    set isRecyclable(value) {
      return this.ptr.writeField(90, "i32", value);
    }
    get isSequenced() {
      return this.ptr.readField(149, "i32").val() === 1;
    }
    set isSequenced(value) {
      return this.ptr.writeField(149, "i32", value);
    }
    get isSpeedBased() {
      return this.ptr.readField(91, "i32").val() === 1;
    }
    set isSpeedBased(value) {
      return this.ptr.writeField(91, "i32", value);
    }
    get loopType() {
      return new LoopType(this.ptr.readField(104, "i32"));
    }
    set loopType(value) {
      return this.ptr.writeField(104, "i32", value);
    }
    get loops() {
      return this.ptr.readField(100, "i32").val();
    }
    set loops(value) {
      return this.ptr.writeField(100, "i32", value);
    }
    get miscInt() {
      return this.ptr.readField(192, "i32").val();
    }
    set miscInt(value) {
      return this.ptr.writeField(192, "i32", value);
    }
    get onComplete() {
      return new TweenCallback(this.ptr.readField(76, "i32"));
    }
    set onComplete(value) {
      return this.ptr.writeField(76, "i32", value);
    }
    get onKill() {
      return new TweenCallback(this.ptr.readField(80, "i32"));
    }
    set onKill(value) {
      return this.ptr.writeField(80, "i32", value);
    }
    get onPause() {
      return new TweenCallback(this.ptr.readField(60, "i32"));
    }
    set onPause(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get onPlay() {
      return new TweenCallback(this.ptr.readField(56, "i32"));
    }
    set onPlay(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get onRewind() {
      return new TweenCallback(this.ptr.readField(64, "i32"));
    }
    set onRewind(value) {
      return this.ptr.writeField(64, "i32", value);
    }
    get onStepComplete() {
      return new TweenCallback(this.ptr.readField(72, "i32"));
    }
    set onStepComplete(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get onUpdate() {
      return new TweenCallback(this.ptr.readField(68, "i32"));
    }
    set onUpdate(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get onWaypointChange() {
      return this.ptr.readField(84, "i32").val();
    }
    set onWaypointChange(value) {
      return this.ptr.writeField(84, "i32", value);
    }
    get sequenceParent() {
      return new Sequence(this.ptr.readField(152, "i32"));
    }
    set sequenceParent(value) {
      return this.ptr.writeField(152, "i32", value);
    }
    get specialStartupMode() {
      return new SpecialStartupMode(this.ptr.readField(160, "i32"));
    }
    set specialStartupMode(value) {
      return this.ptr.writeField(160, "i32", value);
    }
    get startupDone() {
      return this.ptr.readField(165, "i32").val() === 1;
    }
    set startupDone(value) {
      return this.ptr.writeField(165, "i32", value);
    }
    get stringId() {
      return this.ptr.readField(36, "i32").mstr();
    }
    set stringId(value) {
      return this.ptr.writeField(36, "i32", window.ctx.createMstr(value));
    }
    get target() {
      return new UnityObject(this.ptr.readField(44, "i32"));
    }
    set target(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get timeScale() {
      return this.ptr.readField(24, "f32").val();
    }
    set timeScale(value) {
      return this.ptr.writeField(24, "f32", value);
    }
    get typeofT1() {
      return new FieldTypeInfo(this.ptr.readField(136, "i32"));
    }
    set typeofT1(value) {
      return this.ptr.writeField(136, "i32", value);
    }
    get typeofT2() {
      return new FieldTypeInfo(this.ptr.readField(140, "i32"));
    }
    set typeofT2(value) {
      return this.ptr.writeField(140, "i32", value);
    }
    get typeofTPlugOptions() {
      return new FieldTypeInfo(this.ptr.readField(144, "i32"));
    }
    set typeofTPlugOptions(value) {
      return this.ptr.writeField(144, "i32", value);
    }
    get updateType() {
      return new UpdateType(this.ptr.readField(48, "i32"));
    }
    set updateType(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    ApplyTween(arg0, arg1, arg2, arg3, arg4, arg5) {
      return (
        window.ctx.call("DG.Tweening.Tween", "ApplyTween", [this.ptr, arg0, arg1, arg2, arg3, arg4, arg5]).val() === 1
      );
    }
    static DoGoto(arg0, arg1, arg2, arg3) {
      return window.ctx.call("DG.Tweening.Tween", "DoGoto", [arg0, arg1, arg2, arg3]).val() === 1;
    }
    static OnTweenCallback_callback_t(callback, t) {
      return window.ctx.call("DG.Tweening.Tween", "OnTweenCallback_13973", [callback, t]).val() === 1;
    }
    static OnTweenCallback(arg0, arg1, arg2) {
      return window.ctx.call("DG.Tweening.Tween", "OnTweenCallback", [arg0, arg1, arg2]).val() === 1;
    }
    Reset() {
      window.ctx.call("DG.Tweening.Tween", "Reset", [this.ptr]);
    }
    Startup() {
      return window.ctx.call("DG.Tweening.Tween", "Startup", [this.ptr]).val() === 1;
    }
    UpdateDelay(arg0) {
      return window.ctx.call("DG.Tweening.Tween", "UpdateDelay", [this.ptr, arg0]).val();
    }
    Validate() {
      return window.ctx.call("DG.Tweening.Tween", "Validate", [this.ptr]).val() === 1;
    }
  }
  class Sprite {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get associatedAlphaSplitTexture() {
      return new Texture2D(window.ctx.call("UnityEngine.Sprite", "get_associatedAlphaSplitTexture", [this.ptr]));
    }
    get border() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Sprite", "get_border", [out, this.ptr]);
        return out;
      })();
    }
    get bounds() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Sprite", "get_bounds", [out, this.ptr]);
        return out;
      })();
    }
    get extrude() {
      return window.ctx.call("UnityEngine.Sprite", "get_extrude", [this.ptr]).val();
    }
    get packed() {
      return window.ctx.call("UnityEngine.Sprite", "get_packed", [this.ptr]).val() === 1;
    }
    get packingMode() {
      return new SpritePackingMode(window.ctx.call("UnityEngine.Sprite", "get_packingMode", [this.ptr]));
    }
    get packingRotation() {
      return new SpritePackingRotation(window.ctx.call("UnityEngine.Sprite", "get_packingRotation", [this.ptr]));
    }
    get pivot() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Sprite", "get_pivot", [out, this.ptr]);
        return out;
      })();
    }
    get pixelsPerUnit() {
      return window.ctx.call("UnityEngine.Sprite", "get_pixelsPerUnit", [this.ptr]).val();
    }
    get rect() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Sprite", "get_rect", [out, this.ptr]);
        return out;
      })();
    }
    get spriteAtlasTextureScale() {
      return window.ctx.call("UnityEngine.Sprite", "get_spriteAtlasTextureScale", [this.ptr]).val();
    }
    get texture() {
      return new Texture2D(window.ctx.call("UnityEngine.Sprite", "get_texture", [this.ptr]));
    }
    get textureRect() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Sprite", "get_textureRect", [out, this.ptr]);
        return out;
      })();
    }
    get textureRectOffset() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Sprite", "get_textureRectOffset", [out, this.ptr]);
        return out;
      })();
    }
    get triangles() {
      return window.ctx.call("UnityEngine.Sprite", "get_triangles", [this.ptr]);
    }
    get uv() {
      return window.ctx.call("UnityEngine.Sprite", "get_uv", [this.ptr]);
    }
    get vertices() {
      return window.ctx.call("UnityEngine.Sprite", "get_vertices", [this.ptr]);
    }
    AddScriptableObject(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "AddScriptableObject", [this.ptr, arg0]).val() === 1;
    }
    static AddScriptableObject_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Sprite", "AddScriptableObject_Injected", [arg0, arg1]).val() === 1;
    }
    static Create_rect_pivot_pixelsToUnits_texture(rect, pivot, pixelsToUnits, texture) {
      return new Sprite(window.ctx.call("UnityEngine.Sprite", "Create_20195", [rect, pivot, pixelsToUnits, texture]));
    }
    static Create_rect_pivot_pixelsToUnits(rect, pivot, pixelsToUnits) {
      return new Sprite(window.ctx.call("UnityEngine.Sprite", "Create_20196", [rect, pivot, pixelsToUnits]));
    }
    static Create_texture_rect_pivot_pixelsPerUnit_extrude_meshType_border_generateFallbackPhysicsShape(
      texture,
      rect,
      pivot,
      pixelsPerUnit,
      extrude,
      meshType,
      border,
      generateFallbackPhysicsShape,
    ) {
      return new Sprite(
        window.ctx.call("UnityEngine.Sprite", "Create_20197", [
          texture,
          rect,
          pivot,
          pixelsPerUnit,
          extrude,
          meshType,
          border,
          generateFallbackPhysicsShape,
        ]),
      );
    }
    static Create_texture_rect_pivot_pixelsPerUnit_extrude_meshType_border_generateFallbackPhysicsShape_secondaryTextures(
      texture,
      rect,
      pivot,
      pixelsPerUnit,
      extrude,
      meshType,
      border,
      generateFallbackPhysicsShape,
      secondaryTextures,
    ) {
      return new Sprite(
        window.ctx.call("UnityEngine.Sprite", "Create_20198", [
          texture,
          rect,
          pivot,
          pixelsPerUnit,
          extrude,
          meshType,
          border,
          generateFallbackPhysicsShape,
          secondaryTextures,
        ]),
      );
    }
    static Create_texture_rect_pivot_pixelsPerUnit_extrude_meshType_border(
      texture,
      rect,
      pivot,
      pixelsPerUnit,
      extrude,
      meshType,
      border,
    ) {
      return new Sprite(
        window.ctx.call("UnityEngine.Sprite", "Create_20199", [
          texture,
          rect,
          pivot,
          pixelsPerUnit,
          extrude,
          meshType,
          border,
        ]),
      );
    }
    static Create_texture_rect_pivot_pixelsPerUnit_extrude_meshType(
      texture,
      rect,
      pivot,
      pixelsPerUnit,
      extrude,
      meshType,
    ) {
      return new Sprite(
        window.ctx.call("UnityEngine.Sprite", "Create_20200", [texture, rect, pivot, pixelsPerUnit, extrude, meshType]),
      );
    }
    static Create_texture_rect_pivot_pixelsPerUnit_extrude(texture, rect, pivot, pixelsPerUnit, extrude) {
      return new Sprite(
        window.ctx.call("UnityEngine.Sprite", "Create_20201", [texture, rect, pivot, pixelsPerUnit, extrude]),
      );
    }
    static Create_texture_rect_pivot_pixelsPerUnit(texture, rect, pivot, pixelsPerUnit) {
      return new Sprite(window.ctx.call("UnityEngine.Sprite", "Create_20202", [texture, rect, pivot, pixelsPerUnit]));
    }
    static Create_texture_rect_pivot(texture, rect, pivot) {
      return new Sprite(window.ctx.call("UnityEngine.Sprite", "Create_2993", [texture, rect, pivot]));
    }
    static CreateSprite(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
      return new Sprite(
        window.ctx.call("UnityEngine.Sprite", "CreateSprite", [arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8]),
      );
    }
    static CreateSpriteWithoutTextureScripting(arg0, arg1, arg2, arg3) {
      return new Sprite(
        window.ctx.call("UnityEngine.Sprite", "CreateSpriteWithoutTextureScripting", [arg0, arg1, arg2, arg3]),
      );
    }
    static CreateSpriteWithoutTextureScripting_Injected(arg0, arg1, arg2, arg3) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Sprite", "CreateSpriteWithoutTextureScripting_Injected", [
          out,
          arg0,
          arg1,
          arg2,
          arg3,
        ]);
        return out;
      })();
    }
    static CreateSprite_Injected(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Sprite", "CreateSprite_Injected", [
          out,
          arg0,
          arg1,
          arg2,
          arg3,
          arg4,
          arg5,
          arg6,
          arg7,
          arg8,
        ]);
        return out;
      })();
    }
    GetInnerUVs() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Sprite", "GetInnerUVs", [out, this.ptr]);
        return out;
      })();
    }
    static GetInnerUVs_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "GetInnerUVs_Injected", [arg0, arg1]);
    }
    GetOuterUVs() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Sprite", "GetOuterUVs", [out, this.ptr]);
        return out;
      })();
    }
    static GetOuterUVs_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "GetOuterUVs_Injected", [arg0, arg1]);
    }
    GetPacked() {
      return window.ctx.call("UnityEngine.Sprite", "GetPacked", [this.ptr]).val();
    }
    static GetPacked_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "GetPacked_Injected", [arg0]).val();
    }
    GetPackingMode() {
      return window.ctx.call("UnityEngine.Sprite", "GetPackingMode", [this.ptr]).val();
    }
    static GetPackingMode_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "GetPackingMode_Injected", [arg0]).val();
    }
    GetPackingRotation() {
      return window.ctx.call("UnityEngine.Sprite", "GetPackingRotation", [this.ptr]).val();
    }
    static GetPackingRotation_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "GetPackingRotation_Injected", [arg0]).val();
    }
    GetPadding() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Sprite", "GetPadding", [out, this.ptr]);
        return out;
      })();
    }
    static GetPadding_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "GetPadding_Injected", [arg0, arg1]);
    }
    GetPhysicsShape_shapeIdx_physicsShape(shapeIdx, physicsShape) {
      return window.ctx.call("UnityEngine.Sprite", "GetPhysicsShape_20187", [this.ptr, shapeIdx, physicsShape]).val();
    }
    GetPhysicsShape_shapeIdx(shapeIdx) {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Sprite", "GetPhysicsShape_20188", [out, this.ptr, shapeIdx]);
        return out;
      })();
    }
    GetPhysicsShapeCount() {
      return window.ctx.call("UnityEngine.Sprite", "GetPhysicsShapeCount", [this.ptr]).val();
    }
    static GetPhysicsShapeCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "GetPhysicsShapeCount_Injected", [arg0]).val();
    }
    static GetPhysicsShapeImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Sprite", "GetPhysicsShapeImpl", [arg0, arg1, arg2]);
    }
    static GetPhysicsShapeImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Sprite", "GetPhysicsShapeImpl_Injected", [arg0, arg1, arg2]);
    }
    GetPhysicsShapePointCount(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "GetPhysicsShapePointCount", [this.ptr, arg0]).val();
    }
    static GetPhysicsShapeSpanImpl(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Sprite", "GetPhysicsShapeSpanImpl", [out, arg0, arg1]);
        return out;
      })();
    }
    static GetPhysicsShapeSpanImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Sprite", "GetPhysicsShapeSpanImpl_Injected", [arg0, arg1, arg2]);
    }
    GetScriptableObjects(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "GetScriptableObjects", [this.ptr, arg0]).val();
    }
    GetScriptableObjectsCount() {
      return window.ctx.call("UnityEngine.Sprite", "GetScriptableObjectsCount", [this.ptr]).val();
    }
    static GetScriptableObjectsCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "GetScriptableObjectsCount_Injected", [arg0]).val();
    }
    static GetScriptableObjects_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Sprite", "GetScriptableObjects_Injected", [arg0, arg1]).val();
    }
    GetSecondaryTexture(arg0) {
      return new Texture2D(window.ctx.call("UnityEngine.Sprite", "GetSecondaryTexture", [this.ptr, arg0]));
    }
    GetSecondaryTextureCount() {
      return window.ctx.call("UnityEngine.Sprite", "GetSecondaryTextureCount", [this.ptr]).val();
    }
    static GetSecondaryTextureCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "GetSecondaryTextureCount_Injected", [arg0]).val();
    }
    static GetSecondaryTexture_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Sprite", "GetSecondaryTexture_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    GetSecondaryTextures(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "GetSecondaryTextures", [this.ptr, arg0]).val();
    }
    static GetSecondaryTextures_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Sprite", "GetSecondaryTextures_Injected", [arg0, arg1]).val();
    }
    GetTextureRect() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Sprite", "GetTextureRect", [out, this.ptr]);
        return out;
      })();
    }
    GetTextureRectOffset() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Sprite", "GetTextureRectOffset", [out, this.ptr]);
        return out;
      })();
    }
    static GetTextureRectOffset_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "GetTextureRectOffset_Injected", [arg0, arg1]);
    }
    static GetTextureRect_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "GetTextureRect_Injected", [arg0, arg1]);
    }
    Internal_GetPhysicsShapePointCount(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "Internal_GetPhysicsShapePointCount", [this.ptr, arg0]).val();
    }
    static Internal_GetPhysicsShapePointCount_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Sprite", "Internal_GetPhysicsShapePointCount_Injected", [arg0, arg1]).val();
    }
    OverrideGeometry(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "OverrideGeometry", [this.ptr, arg0, arg1]);
    }
    static OverrideGeometry_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Sprite", "OverrideGeometry_Injected", [arg0, arg1, arg2]);
    }
    OverridePhysicsShape_physicsShapes(physicsShapes) {
      window.ctx.call("UnityEngine.Sprite", "OverridePhysicsShape_20191", [this.ptr, physicsShapes]);
    }
    static OverridePhysicsShape_sprite_physicsShape_idx(sprite, physicsShape, idx) {
      window.ctx.call("UnityEngine.Sprite", "OverridePhysicsShape_20193", [sprite, physicsShape, idx]);
    }
    static OverridePhysicsShapeCount(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "OverridePhysicsShapeCount", [arg0, arg1]);
    }
    static OverridePhysicsShapeCount_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "OverridePhysicsShapeCount_Injected", [arg0, arg1]);
    }
    static OverridePhysicsShape_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Sprite", "OverridePhysicsShape_Injected", [arg0, arg1, arg2]);
    }
    RemoveScriptableObjectAt(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "RemoveScriptableObjectAt", [this.ptr, arg0]).val() === 1;
    }
    static RemoveScriptableObjectAt_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Sprite", "RemoveScriptableObjectAt_Injected", [arg0, arg1]).val() === 1;
    }
    SetScriptableObjectAt(arg0, arg1) {
      return window.ctx.call("UnityEngine.Sprite", "SetScriptableObjectAt", [this.ptr, arg0, arg1]).val() === 1;
    }
    static SetScriptableObjectAt_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Sprite", "SetScriptableObjectAt_Injected", [arg0, arg1, arg2]).val() === 1;
    }
    static get_associatedAlphaSplitTexture_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Sprite", "get_associatedAlphaSplitTexture_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_border_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "get_border_Injected", [arg0, arg1]);
    }
    static get_bounds_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "get_bounds_Injected", [arg0, arg1]);
    }
    static get_extrude_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "get_extrude_Injected", [arg0]).val();
    }
    static get_pivot_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "get_pivot_Injected", [arg0, arg1]);
    }
    static get_pixelsPerUnit_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "get_pixelsPerUnit_Injected", [arg0]).val();
    }
    static get_rect_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Sprite", "get_rect_Injected", [arg0, arg1]);
    }
    static get_spriteAtlasTextureScale_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "get_spriteAtlasTextureScale_Injected", [arg0]).val();
    }
    static get_texture_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Sprite", "get_texture_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_triangles_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "get_triangles_Injected", [arg0]);
    }
    static get_uv_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "get_uv_Injected", [arg0]);
    }
    static get_vertices_Injected(arg0) {
      return window.ctx.call("UnityEngine.Sprite", "get_vertices_Injected", [arg0]);
    }
  }
  class AnimationCurve {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get Item() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AnimationCurve", "get_Item", [out, this.ptr, index]);
        return out;
      })();
    }
    get keys() {
      return window.ctx.call("UnityEngine.AnimationCurve", "get_keys", [this.ptr]);
    }
    set keys(value) {
      window.ctx.call("UnityEngine.AnimationCurve", "set_keys", [this.ptr, value]);
    }
    get length() {
      return window.ctx.call("UnityEngine.AnimationCurve", "get_length", [this.ptr]).val();
    }
    get m_Ptr() {
      return this.ptr.readField(8, "i32");
    }
    set m_Ptr(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    get m_RequiresNativeCleanup() {
      return this.ptr.readField(12, "i32").val() === 1;
    }
    set m_RequiresNativeCleanup(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    AddKey(arg0) {
      return window.ctx.call("UnityEngine.AnimationCurve", "AddKey", [this.ptr, arg0]).val();
    }
    AddKey_Internal(arg0) {
      return window.ctx.call("UnityEngine.AnimationCurve", "AddKey_Internal", [this.ptr, arg0]).val();
    }
    static AddKey_Internal_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.AnimationCurve", "AddKey_Internal_Injected", [arg0, arg1]).val();
    }
    static EaseInOut(arg0, arg1, arg2, arg3) {
      return new AnimationCurve(window.ctx.call("UnityEngine.AnimationCurve", "EaseInOut", [arg0, arg1, arg2, arg3]));
    }
    Equals_o(o) {
      return window.ctx.call("UnityEngine.AnimationCurve", "Equals_20262", [this.ptr, o]).val() === 1;
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.AnimationCurve", "Equals_20263", [this.ptr, other]).val() === 1;
    }
    Evaluate(arg0) {
      return window.ctx.call("UnityEngine.AnimationCurve", "Evaluate", [this.ptr, arg0]).val();
    }
    static Evaluate_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.AnimationCurve", "Evaluate_Injected", [arg0, arg1]).val();
    }
    Finalize() {
      window.ctx.call("UnityEngine.AnimationCurve", "Finalize", [this.ptr]);
    }
    GetHashCode() {
      return window.ctx.call("UnityEngine.AnimationCurve", "GetHashCode", [this.ptr]).val();
    }
    static GetHashCode_Injected(arg0) {
      return window.ctx.call("UnityEngine.AnimationCurve", "GetHashCode_Injected", [arg0]).val();
    }
    GetKey(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AnimationCurve", "GetKey", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetKey_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.AnimationCurve", "GetKey_Injected", [arg0, arg1, arg2]);
    }
    static Internal_Create(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AnimationCurve", "Internal_Create", [out, arg0]);
        return out;
      })();
    }
    static Internal_Create_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.AnimationCurve", "Internal_Create_Injected", [out, arg0]);
        return out;
      })();
    }
    static Internal_Destroy(arg0) {
      window.ctx.call("UnityEngine.AnimationCurve", "Internal_Destroy", [arg0]);
    }
    Internal_Equals(arg0) {
      return window.ctx.call("UnityEngine.AnimationCurve", "Internal_Equals", [this.ptr, arg0]).val() === 1;
    }
    static Internal_Equals_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.AnimationCurve", "Internal_Equals_Injected", [arg0, arg1]).val() === 1;
    }
    static get_keys_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AnimationCurve", "get_keys_Injected", [arg0, arg1]);
    }
    static get_length_Injected(arg0) {
      return window.ctx.call("UnityEngine.AnimationCurve", "get_length_Injected", [arg0]).val();
    }
    static set_keys_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.AnimationCurve", "set_keys_Injected", [arg0, arg1]);
    }
  }
  class Coroutine {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get m_Ptr() {
      return this.ptr.readField(8, "i32");
    }
    set m_Ptr(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    Finalize() {
      window.ctx.call("UnityEngine.Coroutine", "Finalize", [this.ptr]);
    }
    static ReleaseCoroutine(arg0) {
      window.ctx.call("UnityEngine.Coroutine", "ReleaseCoroutine", [arg0]);
    }
  }
  class RuntimeAnimatorController {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get animationClips() {
      return window.ctx.call("UnityEngine.RuntimeAnimatorController", "get_animationClips", [this.ptr]);
    }
    static get_animationClips_Injected(arg0) {
      return window.ctx.call("UnityEngine.RuntimeAnimatorController", "get_animationClips_Injected", [arg0]);
    }
  }
  class PlayerState {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get assists() {
      return this.ptr.readField(40, "i32");
    }
    set assists(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get back() {
      return this.ptr.readField(46, "i32");
    }
    set back(value) {
      return this.ptr.writeField(46, "i32", value);
    }
    get crouching() {
      return this.ptr.readField(64, "i32").val() === 1;
    }
    set crouching(value) {
      return this.ptr.writeField(64, "i32", value);
    }
    get currentKillStreak() {
      return this.ptr.readField(92, "f32").val();
    }
    set currentKillStreak(value) {
      return this.ptr.writeField(92, "f32", value);
    }
    get damageDealt() {
      return this.ptr.readField(104, "i32");
    }
    set damageDealt(value) {
      return this.ptr.writeField(104, "i32", value);
    }
    get deaths() {
      return this.ptr.readField(38, "i32");
    }
    set deaths(value) {
      return this.ptr.writeField(38, "i32", value);
    }
    get elo() {
      return this.ptr.readField(32, "f32").val();
    }
    set elo(value) {
      return this.ptr.writeField(32, "f32", value);
    }
    get endResults() {
      return new PlayerEndResults(this.ptr.readField(128, "i32"));
    }
    set endResults(value) {
      return this.ptr.writeField(128, "i32", value);
    }
    get face() {
      return this.ptr.readField(48, "i32");
    }
    set face(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    get glove() {
      return this.ptr.readField(50, "i32");
    }
    set glove(value) {
      return this.ptr.writeField(50, "i32", value);
    }
    get hat() {
      return this.ptr.readField(44, "i32");
    }
    set hat(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get headshots() {
      return this.ptr.readField(100, "f32").val();
    }
    set headshots(value) {
      return this.ptr.writeField(100, "f32", value);
    }
    get health() {
      return this.ptr.readField(60, "i32");
    }
    set health(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get healthProtected() {
      return this.ptr.readField(70, "i32").val() === 1;
    }
    set healthProtected(value) {
      return this.ptr.writeField(70, "i32", value);
    }
    get inventory() {
      return this.ptr.readField(72, "i32");
    }
    set inventory(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get isPremium() {
      return this.ptr.readField(124, "i32").val() === 1;
    }
    set isPremium(value) {
      return this.ptr.writeField(124, "i32", value);
    }
    get kills() {
      return this.ptr.readField(36, "i32");
    }
    set kills(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get killsWithWeapon() {
      return this.ptr.readField(96, "f32").val();
    }
    set killsWithWeapon(value) {
      return this.ptr.writeField(96, "f32", value);
    }
    get lastGotShot() {
      return new PlayerLastGotShot(this.ptr.readField(88, "i32"));
    }
    set lastGotShot(value) {
      return this.ptr.writeField(88, "i32", value);
    }
    get lastShootTime() {
      return this.ptr.readField(116, "f32").val();
    }
    set lastShootTime(value) {
      return this.ptr.writeField(116, "f32", value);
    }
    get lastShotTime() {
      return this.ptr.readField(112, "f32").val();
    }
    set lastShotTime(value) {
      return this.ptr.writeField(112, "f32", value);
    }
    get lastTeleportTime() {
      return this.ptr.readField(120, "f32").val();
    }
    set lastTeleportTime(value) {
      return this.ptr.writeField(120, "f32", value);
    }
    get localWeaponIndex() {
      return this.ptr.readField(67, "i32");
    }
    set localWeaponIndex(value) {
      return this.ptr.writeField(67, "i32", value);
    }
    get mapVote() {
      return this.ptr.readField(69, "i32");
    }
    set mapVote(value) {
      return this.ptr.writeField(69, "i32", value);
    }
    get maxKillStreak() {
      return this.ptr.readField(54, "i32");
    }
    set maxKillStreak(value) {
      return this.ptr.writeField(54, "i32", value);
    }
    get mobile() {
      return this.ptr.readField(66, "i32").val() === 1;
    }
    set mobile(value) {
      return this.ptr.writeField(66, "i32", value);
    }
    get nickname() {
      return this.ptr.readField(24, "i32").mstr();
    }
    set nickname(value) {
      return this.ptr.writeField(24, "i32", window.ctx.createMstr(value));
    }
    get party() {
      return this.ptr.readField(80, "i32").mstr();
    }
    set party(value) {
      return this.ptr.writeField(80, "i32", window.ctx.createMstr(value));
    }
    get playerId() {
      return this.ptr.readField(20, "i32").mstr();
    }
    set playerId(value) {
      return this.ptr.writeField(20, "i32", window.ctx.createMstr(value));
    }
    get rigid() {
      return new PlayerRigidState(this.ptr.readField(56, "i32"));
    }
    set rigid(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get sceneLoaded() {
      return this.ptr.readField(65, "i32").val() === 1;
    }
    set sceneLoaded(value) {
      return this.ptr.writeField(65, "i32", value);
    }
    get score() {
      return this.ptr.readField(28, "i32");
    }
    set score(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get selectedGunSkins() {
      return this.ptr.readField(16, "i32");
    }
    set selectedGunSkins(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get skin() {
      return this.ptr.readField(42, "i32");
    }
    set skin(value) {
      return this.ptr.writeField(42, "i32", value);
    }
    get sliding() {
      return this.ptr.readField(63, "i32").val() === 1;
    }
    set sliding(value) {
      return this.ptr.writeField(63, "i32", value);
    }
    get spawned() {
      return this.ptr.readField(62, "i32").val() === 1;
    }
    set spawned(value) {
      return this.ptr.writeField(62, "i32", value);
    }
    get startPlayTime() {
      return this.ptr.readField(108, "f32").val();
    }
    set startPlayTime(value) {
      return this.ptr.writeField(108, "f32", value);
    }
    get team() {
      return this.ptr.readField(68, "i32");
    }
    set team(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get user() {
      return new PlayerUser(this.ptr.readField(84, "i32"));
    }
    set user(value) {
      return this.ptr.writeField(84, "i32", value);
    }
    get userId() {
      return this.ptr.readField(76, "i32").mstr();
    }
    set userId(value) {
      return this.ptr.writeField(76, "i32", window.ctx.createMstr(value));
    }
    get weaponClass() {
      return this.ptr.readField(61, "i32");
    }
    set weaponClass(value) {
      return this.ptr.writeField(61, "i32", value);
    }
    get weaponsCollected() {
      return this.ptr.readField(52, "i32");
    }
    set weaponsCollected(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get winStreak() {
      return this.ptr.readField(126, "i32");
    }
    set winStreak(value) {
      return this.ptr.writeField(126, "i32", value);
    }
  }
  class ShakePreset {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get FadeIn() {
      return window.ctx.call("MilkShake.ShakePreset", "get_FadeIn", [this.ptr]).val();
    }
    set FadeIn(value) {
      window.ctx.call("MilkShake.ShakePreset", "set_FadeIn", [this.ptr, value]);
    }
    get FadeOut() {
      return window.ctx.call("MilkShake.ShakePreset", "get_FadeOut", [this.ptr]).val();
    }
    set FadeOut(value) {
      window.ctx.call("MilkShake.ShakePreset", "set_FadeOut", [this.ptr, value]);
    }
    get PositionInfluence() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("MilkShake.ShakePreset", "get_PositionInfluence", [out, this.ptr]);
        return out;
      })();
    }
    set PositionInfluence(value) {
      window.ctx.call("MilkShake.ShakePreset", "set_PositionInfluence", [this.ptr, value]);
    }
    get RotationInfluence() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("MilkShake.ShakePreset", "get_RotationInfluence", [out, this.ptr]);
        return out;
      })();
    }
    set RotationInfluence(value) {
      window.ctx.call("MilkShake.ShakePreset", "set_RotationInfluence", [this.ptr, value]);
    }
    get Roughness() {
      return window.ctx.call("MilkShake.ShakePreset", "get_Roughness", [this.ptr]).val();
    }
    set Roughness(value) {
      window.ctx.call("MilkShake.ShakePreset", "set_Roughness", [this.ptr, value]);
    }
    get ShakeType() {
      return new ShakePresetShakeType(window.ctx.call("MilkShake.ShakePreset", "get_ShakeType", [this.ptr]));
    }
    set ShakeType(value) {
      window.ctx.call("MilkShake.ShakePreset", "set_ShakeType", [this.ptr, value]);
    }
    get Strength() {
      return window.ctx.call("MilkShake.ShakePreset", "get_Strength", [this.ptr]).val();
    }
    set Strength(value) {
      window.ctx.call("MilkShake.ShakePreset", "set_Strength", [this.ptr, value]);
    }
    get fadeIn() {
      return this.ptr.readField(24, "f32").val();
    }
    set fadeIn(value) {
      return this.ptr.writeField(24, "f32", value);
    }
    get fadeOut() {
      return this.ptr.readField(28, "f32").val();
    }
    set fadeOut(value) {
      return this.ptr.writeField(28, "f32", value);
    }
    get positionInfluence() {
      return new Vector3(this.ptr.readField(32, "i32"));
    }
    set positionInfluence(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get rotationInfluence() {
      return new Vector3(this.ptr.readField(44, "i32"));
    }
    set rotationInfluence(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get roughness() {
      return this.ptr.readField(20, "f32").val();
    }
    set roughness(value) {
      return this.ptr.writeField(20, "f32", value);
    }
    get shakeType() {
      return new ShakePresetShakeType(this.ptr.readField(12, "i32"));
    }
    set shakeType(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get strength() {
      return this.ptr.readField(16, "f32").val();
    }
    set strength(value) {
      return this.ptr.writeField(16, "f32", value);
    }
  }
  class GrenadeData {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get grenadeId() {
      return this.ptr.readField(24, "i32").mstr();
    }
    set grenadeId(value) {
      return this.ptr.writeField(24, "i32", window.ctx.createMstr(value));
    }
    get initialVelocity() {
      return new SchemaVector3(this.ptr.readField(36, "i32"));
    }
    set initialVelocity(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get ownerSessionId() {
      return this.ptr.readField(32, "i32").mstr();
    }
    set ownerSessionId(value) {
      return this.ptr.writeField(32, "i32", window.ctx.createMstr(value));
    }
    get position() {
      return new SchemaVector3(this.ptr.readField(16, "i32"));
    }
    set position(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get rotation() {
      return new SchemaVector3(this.ptr.readField(20, "i32"));
    }
    set rotation(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get weaponId() {
      return this.ptr.readField(28, "i32");
    }
    set weaponId(value) {
      return this.ptr.writeField(28, "i32", value);
    }
  }
  class LayerMask {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get value() {
      return window.ctx.call("UnityEngine.LayerMask", "get_value", [this.ptr]).val();
    }
    get m_Mask() {
      return this.ptr.readField(0, "i32").val();
    }
    set m_Mask(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    static GetMask(arg0) {
      return window.ctx.call("UnityEngine.LayerMask", "GetMask", [arg0]).val();
    }
    static NameToLayer(arg0) {
      return window.ctx.call("UnityEngine.LayerMask", "NameToLayer", [arg0]).val();
    }
    static NameToLayer_Injected(arg0) {
      return window.ctx.call("UnityEngine.LayerMask", "NameToLayer_Injected", [arg0]).val();
    }
  }
  class ColyTeamMember {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get OnTeamChanged() {
      return this.ptr.readField(44, "i32");
    }
    set OnTeamChanged(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get globalFlagHolderTransform() {
      return new Transform(this.ptr.readField(20, "i32"));
    }
    set globalFlagHolderTransform(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get holdingFlag() {
      return new FlagState(this.ptr.readField(32, "i32"));
    }
    set holdingFlag(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get isTeams() {
      return this.ptr.readField(0, "i32").val() === 1;
    }
    set isTeams(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get localFlagHolderTransform() {
      return new Transform(this.ptr.readField(24, "i32"));
    }
    set localFlagHolderTransform(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get team() {
      return new TeamInfo(this.ptr.readField(36, "i32"));
    }
    set team(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get teamIndex() {
      return this.ptr.readField(28, "i32");
    }
    set teamIndex(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get unregisterOnTeamChange() {
      return new Action(this.ptr.readField(40, "i32"));
    }
    set unregisterOnTeamChange(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    AmIYourEnemy() {
      return window.ctx.call("ColyTeamMember", "AmIYourEnemy", [this.ptr]).val() === 1;
    }
    GetFlagHolderTransform() {
      return new Transform(window.ctx.call("ColyTeamMember", "GetFlagHolderTransform", [this.ptr]));
    }
    static GetMyPlayerTeam() {
      return window.ctx.call("ColyTeamMember", "GetMyPlayerTeam", []).val();
    }
    GetTeam() {
      return new TeamInfo(window.ctx.call("ColyTeamMember", "GetTeam", [this.ptr]));
    }
    HandleTeamChange(arg0, arg1) {
      window.ctx.call("ColyTeamMember", "HandleTeamChange", [this.ptr, arg0, arg1]);
    }
    HasAnyFlag() {
      return window.ctx.call("ColyTeamMember", "HasAnyFlag", [this.ptr]).val() === 1;
    }
    IsEnemy(arg0) {
      return window.ctx.call("ColyTeamMember", "IsEnemy", [this.ptr, arg0]).val() === 1;
    }
    OnDisable() {
      window.ctx.call("ColyTeamMember", "OnDisable", [this.ptr]);
    }
    OnNetworkSpawned(arg0) {
      window.ctx.call("ColyTeamMember", "OnNetworkSpawned", [this.ptr, arg0]);
    }
  }
  class TrashCan {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get Lid() {
      return new Transform(this.ptr.readField(20, "i32"));
    }
    set Lid(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get animationDuration() {
      return this.ptr.readField(32, "f32").val();
    }
    set animationDuration(value) {
      return this.ptr.writeField(32, "f32", value);
    }
    get animationEase() {
      return new Ease(this.ptr.readField(36, "i32"));
    }
    set animationEase(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get closedLidTarget() {
      return new Transform(this.ptr.readField(28, "i32"));
    }
    set closedLidTarget(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get highlighted() {
      return this.ptr.readField(40, "i32").val() === 1;
    }
    set highlighted(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get openLidTarget() {
      return new Transform(this.ptr.readField(24, "i32"));
    }
    set openLidTarget(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get waypoint() {
      return new GameObject(this.ptr.readField(16, "i32"));
    }
    set waypoint(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    CloseLid() {
      window.ctx.call("TrashCan", "CloseLid", [this.ptr]);
    }
    static Interact() {
      window.ctx.call("TrashCan", "Interact", []);
    }
    OnHighlight() {
      window.ctx.call("TrashCan", "OnHighlight", [this.ptr]);
    }
    OnUnhighlight() {
      window.ctx.call("TrashCan", "OnUnhighlight", [this.ptr]);
    }
    OpenLid() {
      window.ctx.call("TrashCan", "OpenLid", [this.ptr]);
    }
    Update() {
      window.ctx.call("TrashCan", "Update", [this.ptr]);
    }
  }
  class UIImage {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get activeSprite() {
      return new Sprite(window.ctx.call("UnityEngine.UI.Image", "get_activeSprite", [this.ptr]));
    }
    get alphaHitTestMinimumThreshold() {
      return window.ctx.call("UnityEngine.UI.Image", "get_alphaHitTestMinimumThreshold", [this.ptr]).val();
    }
    set alphaHitTestMinimumThreshold(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_alphaHitTestMinimumThreshold", [this.ptr, value]);
    }
    static get defaultETC1GraphicMaterial() {
      return new Material(window.ctx.call("UnityEngine.UI.Image", "get_defaultETC1GraphicMaterial", []));
    }
    get eventAlphaThreshold() {
      return window.ctx.call("UnityEngine.UI.Image", "get_eventAlphaThreshold", [this.ptr]).val();
    }
    set eventAlphaThreshold(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_eventAlphaThreshold", [this.ptr, value]);
    }
    get fillAmount() {
      return window.ctx.call("UnityEngine.UI.Image", "get_fillAmount", [this.ptr]).val();
    }
    set fillAmount(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_fillAmount", [this.ptr, value]);
    }
    get fillCenter() {
      return window.ctx.call("UnityEngine.UI.Image", "get_fillCenter", [this.ptr]).val() === 1;
    }
    set fillCenter(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_fillCenter", [this.ptr, value]);
    }
    get fillClockwise() {
      return window.ctx.call("UnityEngine.UI.Image", "get_fillClockwise", [this.ptr]).val() === 1;
    }
    set fillClockwise(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_fillClockwise", [this.ptr, value]);
    }
    get fillMethod() {
      return window.ctx.call("UnityEngine.UI.Image", "get_fillMethod", [this.ptr]);
    }
    set fillMethod(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_fillMethod", [this.ptr, value]);
    }
    get fillOrigin() {
      return window.ctx.call("UnityEngine.UI.Image", "get_fillOrigin", [this.ptr]).val();
    }
    set fillOrigin(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_fillOrigin", [this.ptr, value]);
    }
    get flexibleHeight() {
      return window.ctx.call("UnityEngine.UI.Image", "get_flexibleHeight", [this.ptr]).val();
    }
    get flexibleWidth() {
      return window.ctx.call("UnityEngine.UI.Image", "get_flexibleWidth", [this.ptr]).val();
    }
    get hasBorder() {
      return window.ctx.call("UnityEngine.UI.Image", "get_hasBorder", [this.ptr]).val() === 1;
    }
    get layoutPriority() {
      return window.ctx.call("UnityEngine.UI.Image", "get_layoutPriority", [this.ptr]).val();
    }
    get mainTexture() {
      return new Texture(window.ctx.call("UnityEngine.UI.Image", "get_mainTexture", [this.ptr]));
    }
    get material() {
      return new Material(window.ctx.call("UnityEngine.UI.Image", "get_material", [this.ptr]));
    }
    set material(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_material", [this.ptr, value]);
    }
    get minHeight() {
      return window.ctx.call("UnityEngine.UI.Image", "get_minHeight", [this.ptr]).val();
    }
    get minWidth() {
      return window.ctx.call("UnityEngine.UI.Image", "get_minWidth", [this.ptr]).val();
    }
    get multipliedPixelsPerUnit() {
      return window.ctx.call("UnityEngine.UI.Image", "get_multipliedPixelsPerUnit", [this.ptr]).val();
    }
    get overrideSprite() {
      return new Sprite(window.ctx.call("UnityEngine.UI.Image", "get_overrideSprite", [this.ptr]));
    }
    set overrideSprite(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_overrideSprite", [this.ptr, value]);
    }
    get pixelsPerUnit() {
      return window.ctx.call("UnityEngine.UI.Image", "get_pixelsPerUnit", [this.ptr]).val();
    }
    get pixelsPerUnitMultiplier() {
      return window.ctx.call("UnityEngine.UI.Image", "get_pixelsPerUnitMultiplier", [this.ptr]).val();
    }
    set pixelsPerUnitMultiplier(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_pixelsPerUnitMultiplier", [this.ptr, value]);
    }
    get preferredHeight() {
      return window.ctx.call("UnityEngine.UI.Image", "get_preferredHeight", [this.ptr]).val();
    }
    get preferredWidth() {
      return window.ctx.call("UnityEngine.UI.Image", "get_preferredWidth", [this.ptr]).val();
    }
    get preserveAspect() {
      return window.ctx.call("UnityEngine.UI.Image", "get_preserveAspect", [this.ptr]).val() === 1;
    }
    set preserveAspect(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_preserveAspect", [this.ptr, value]);
    }
    get secondaryTextures() {
      return window.ctx.call("UnityEngine.UI.Image", "get_secondaryTextures", [this.ptr]);
    }
    get sprite() {
      return new Sprite(window.ctx.call("UnityEngine.UI.Image", "get_sprite", [this.ptr]));
    }
    set sprite(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_sprite", [this.ptr, value]);
    }
    get type() {
      return new FieldTypeInfo(window.ctx.call("UnityEngine.UI.Image", "get_type", [this.ptr]));
    }
    set type(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_type", [this.ptr, value]);
    }
    get useSpriteMesh() {
      return window.ctx.call("UnityEngine.UI.Image", "get_useSpriteMesh", [this.ptr]).val() === 1;
    }
    set useSpriteMesh(value) {
      window.ctx.call("UnityEngine.UI.Image", "set_useSpriteMesh", [this.ptr, value]);
    }
    get m_AlphaHitTestMinimumThreshold() {
      return this.ptr.readField(160, "f32").val();
    }
    set m_AlphaHitTestMinimumThreshold(value) {
      return this.ptr.writeField(160, "f32", value);
    }
    get m_CachedReferencePixelsPerUnit() {
      return this.ptr.readField(172, "f32").val();
    }
    set m_CachedReferencePixelsPerUnit(value) {
      return this.ptr.writeField(172, "f32", value);
    }
    get m_FillAmount() {
      return this.ptr.readField(148, "f32").val();
    }
    set m_FillAmount(value) {
      return this.ptr.writeField(148, "f32", value);
    }
    get m_FillCenter() {
      return this.ptr.readField(141, "i32").val() === 1;
    }
    set m_FillCenter(value) {
      return this.ptr.writeField(141, "i32", value);
    }
    get m_FillClockwise() {
      return this.ptr.readField(152, "i32").val() === 1;
    }
    set m_FillClockwise(value) {
      return this.ptr.writeField(152, "i32", value);
    }
    get m_FillMethod() {
      return this.ptr.readField(144, "i32");
    }
    set m_FillMethod(value) {
      return this.ptr.writeField(144, "i32", value);
    }
    get m_FillOrigin() {
      return this.ptr.readField(156, "i32").val();
    }
    set m_FillOrigin(value) {
      return this.ptr.writeField(156, "i32", value);
    }
    get m_OverrideSprite() {
      return new Sprite(this.ptr.readField(132, "i32"));
    }
    set m_OverrideSprite(value) {
      return this.ptr.writeField(132, "i32", value);
    }
    get m_PixelsPerUnitMultiplier() {
      return this.ptr.readField(168, "f32").val();
    }
    set m_PixelsPerUnitMultiplier(value) {
      return this.ptr.writeField(168, "f32", value);
    }
    get m_PreserveAspect() {
      return this.ptr.readField(140, "i32").val() === 1;
    }
    set m_PreserveAspect(value) {
      return this.ptr.writeField(140, "i32", value);
    }
    get m_SecondaryTextures() {
      return JSArray(this.ptr.readField(176, "i32"));
    }
    set m_SecondaryTextures(value) {
      return this.ptr.writeField(176, "i32", value);
    }
    get m_Sprite() {
      return new Sprite(this.ptr.readField(128, "i32"));
    }
    set m_Sprite(value) {
      return this.ptr.writeField(128, "i32", value);
    }
    get m_Tracked() {
      return this.ptr.readField(164, "i32").val() === 1;
    }
    set m_Tracked(value) {
      return this.ptr.writeField(164, "i32", value);
    }
    get m_TrackedTexturelessImages() {
      return this.ptr.readField(24, "i32");
    }
    set m_TrackedTexturelessImages(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get m_Type() {
      return new FieldTypeInfo(this.ptr.readField(136, "i32"));
    }
    set m_Type(value) {
      return this.ptr.writeField(136, "i32", value);
    }
    get m_UseSpriteMesh() {
      return this.ptr.readField(165, "i32").val() === 1;
    }
    set m_UseSpriteMesh(value) {
      return this.ptr.writeField(165, "i32", value);
    }
    get s_ETC1DefaultUI() {
      return new Material(this.ptr.readField(0, "i32"));
    }
    set s_ETC1DefaultUI(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get s_Initialized() {
      return this.ptr.readField(28, "i32").val() === 1;
    }
    set s_Initialized(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get s_TempNewSecondaryTextures() {
      return JSArray(this.ptr.readField(4, "i32"));
    }
    set s_TempNewSecondaryTextures(value) {
      return this.ptr.writeField(4, "i32", value);
    }
    get s_UVScratch() {
      return JSArray(this.ptr.readField(12, "i32"));
    }
    set s_UVScratch(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get s_Uv() {
      return JSArray(this.ptr.readField(20, "i32"));
    }
    set s_Uv(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get s_VertScratch() {
      return JSArray(this.ptr.readField(8, "i32"));
    }
    set s_VertScratch(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    get s_Xy() {
      return JSArray(this.ptr.readField(16, "i32"));
    }
    set s_Xy(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    static _CheckSecondaryTexturesChanged_g_Compare_93_0(arg0, arg1) {
      return (
        window.ctx
          .call("UnityEngine.UI.Image", "<CheckSecondaryTexturesChanged>g__Compare|93_0", [arg0, arg1])
          .val() === 1
      );
    }
    _set_sprite_g_ResetAlphaHitThresholdIfNeeded_11_0() {
      window.ctx.call("UnityEngine.UI.Image", "<set_sprite>g__ResetAlphaHitThresholdIfNeeded|11_0", [this.ptr]);
    }
    _set_sprite_g_SpriteSupportsAlphaHitTest_11_1() {
      return (
        window.ctx.call("UnityEngine.UI.Image", "<set_sprite>g__SpriteSupportsAlphaHitTest|11_1", [this.ptr]).val() ===
        1
      );
    }
    static AddQuad_vertexHelper_quadPositions_color_quadUVs(vertexHelper, quadPositions, color, quadUVs) {
      window.ctx.call("UnityEngine.UI.Image", "AddQuad_28784", [vertexHelper, quadPositions, color, quadUVs]);
    }
    static AddQuad_vertexHelper_posMin_posMax_color_uvMin_uvMax(vertexHelper, posMin, posMax, color, uvMin, uvMax) {
      window.ctx.call("UnityEngine.UI.Image", "AddQuad_28785", [vertexHelper, posMin, posMax, color, uvMin, uvMax]);
    }
    CalculateLayoutInputHorizontal() {
      window.ctx.call("UnityEngine.UI.Image", "CalculateLayoutInputHorizontal", [this.ptr]);
    }
    CalculateLayoutInputVertical() {
      window.ctx.call("UnityEngine.UI.Image", "CalculateLayoutInputVertical", [this.ptr]);
    }
    CheckSecondaryTexturesChanged_sprite(sprite) {
      return (
        window.ctx.call("UnityEngine.UI.Image", "CheckSecondaryTexturesChanged_28775", [this.ptr, sprite]).val() === 1
      );
    }
    CheckSecondaryTexturesChanged_sprite_newSecondaryTextures(sprite, newSecondaryTextures) {
      return (
        window.ctx
          .call("UnityEngine.UI.Image", "CheckSecondaryTexturesChanged_28776", [this.ptr, sprite, newSecondaryTextures])
          .val() === 1
      );
    }
    static ClearArray(arg0) {
      window.ctx.call("UnityEngine.UI.Image", "ClearArray", [arg0]);
    }
    DisableSpriteOptimizations() {
      window.ctx.call("UnityEngine.UI.Image", "DisableSpriteOptimizations", [this.ptr]);
    }
    GenerateFilledSprite(arg0, arg1) {
      window.ctx.call("UnityEngine.UI.Image", "GenerateFilledSprite", [this.ptr, arg0, arg1]);
    }
    GenerateSimpleSprite(arg0, arg1) {
      window.ctx.call("UnityEngine.UI.Image", "GenerateSimpleSprite", [this.ptr, arg0, arg1]);
    }
    GenerateSlicedSprite(arg0) {
      window.ctx.call("UnityEngine.UI.Image", "GenerateSlicedSprite", [this.ptr, arg0]);
    }
    GenerateSprite(arg0, arg1) {
      window.ctx.call("UnityEngine.UI.Image", "GenerateSprite", [this.ptr, arg0, arg1]);
    }
    GenerateTiledSprite(arg0) {
      window.ctx.call("UnityEngine.UI.Image", "GenerateTiledSprite", [this.ptr, arg0]);
    }
    GetAdjustedBorders(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.UI.Image", "GetAdjustedBorders", [out, this.ptr, arg0, arg1]);
        return out;
      })();
    }
    GetDrawingDimensions(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.UI.Image", "GetDrawingDimensions", [out, this.ptr, arg0]);
        return out;
      })();
    }
    IsRaycastLocationValid(arg0, arg1) {
      return window.ctx.call("UnityEngine.UI.Image", "IsRaycastLocationValid", [this.ptr, arg0, arg1]).val() === 1;
    }
    MapCoordinate(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.UI.Image", "MapCoordinate", [out, this.ptr, arg0, arg1]);
        return out;
      })();
    }
    OnAfterDeserialize() {
      window.ctx.call("UnityEngine.UI.Image", "OnAfterDeserialize", [this.ptr]);
    }
    OnBeforeSerialize() {
      window.ctx.call("UnityEngine.UI.Image", "OnBeforeSerialize", [this.ptr]);
    }
    OnCanvasHierarchyChanged() {
      window.ctx.call("UnityEngine.UI.Image", "OnCanvasHierarchyChanged", [this.ptr]);
    }
    OnDidApplyAnimationProperties() {
      window.ctx.call("UnityEngine.UI.Image", "OnDidApplyAnimationProperties", [this.ptr]);
    }
    OnDisable() {
      window.ctx.call("UnityEngine.UI.Image", "OnDisable", [this.ptr]);
    }
    OnEnable() {
      window.ctx.call("UnityEngine.UI.Image", "OnEnable", [this.ptr]);
    }
    OnPopulateMesh(arg0) {
      window.ctx.call("UnityEngine.UI.Image", "OnPopulateMesh", [this.ptr, arg0]);
    }
    PreserveSpriteAspectRatio(arg0, arg1) {
      window.ctx.call("UnityEngine.UI.Image", "PreserveSpriteAspectRatio", [this.ptr, arg0, arg1]);
    }
    static RadialCut_xy_uv_fill_invert_corner(xy, uv, fill, invert, corner) {
      return window.ctx.call("UnityEngine.UI.Image", "RadialCut_28788", [xy, uv, fill, invert, corner]).val() === 1;
    }
    static RadialCut_xy_cos_sin_invert_corner(xy, cos, sin, invert, corner) {
      window.ctx.call("UnityEngine.UI.Image", "RadialCut_28789", [xy, cos, sin, invert, corner]);
    }
    static RebuildImage(arg0) {
      window.ctx.call("UnityEngine.UI.Image", "RebuildImage", [arg0]);
    }
    SetNativeSize() {
      window.ctx.call("UnityEngine.UI.Image", "SetNativeSize", [this.ptr]);
    }
    SetSecondaryTextures(arg0) {
      window.ctx.call("UnityEngine.UI.Image", "SetSecondaryTextures", [this.ptr, arg0]);
    }
    static TrackImage(arg0) {
      window.ctx.call("UnityEngine.UI.Image", "TrackImage", [arg0]);
    }
    TrackSprite() {
      window.ctx.call("UnityEngine.UI.Image", "TrackSprite", [this.ptr]);
    }
    static UnTrackImage(arg0) {
      window.ctx.call("UnityEngine.UI.Image", "UnTrackImage", [arg0]);
    }
    UpdateMaterial() {
      window.ctx.call("UnityEngine.UI.Image", "UpdateMaterial", [this.ptr]);
    }
  }
  class MovementStateManager {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get CurrentState() {
      return window.ctx.call("MovementStateManager", "get_CurrentState", [this.ptr]);
    }
    set CurrentState(value) {
      window.ctx.call("MovementStateManager", "set_CurrentState", [this.ptr, value]);
    }
    get Crouching() {
      return this.ptr.readField(2, "i32").val() === 1;
    }
    set Crouching(value) {
      return this.ptr.writeField(2, "i32", value);
    }
    get Dashing() {
      return this.ptr.readField(5, "i32").val() === 1;
    }
    set Dashing(value) {
      return this.ptr.writeField(5, "i32", value);
    }
    get Grounded() {
      return this.ptr.readField(0, "i32").val() === 1;
    }
    set Grounded(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get OnLadder() {
      return this.ptr.readField(4, "i32").val() === 1;
    }
    set OnLadder(value) {
      return this.ptr.writeField(4, "i32", value);
    }
    get Sliding() {
      return this.ptr.readField(3, "i32").val() === 1;
    }
    set Sliding(value) {
      return this.ptr.writeField(3, "i32", value);
    }
    get Sprinting() {
      return this.ptr.readField(1, "i32").val() === 1;
    }
    set Sprinting(value) {
      return this.ptr.writeField(1, "i32", value);
    }
    get _currentGroundState() {
      return this.ptr.readField(36, "i32");
    }
    set _currentGroundState(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get _currentState() {
      return this.ptr.readField(32, "i32");
    }
    set _currentState(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get cameraSpring() {
      return new Spring(this.ptr.readField(28, "i32"));
    }
    set cameraSpring(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get colyTransform() {
      return new ColyTransform(this.ptr.readField(20, "i32"));
    }
    set colyTransform(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get colyView() {
      return new ColyView(this.ptr.readField(16, "i32"));
    }
    set colyView(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get isBlocked() {
      return this.ptr.readField(6, "i32").val() === 1;
    }
    set isBlocked(value) {
      return this.ptr.writeField(6, "i32", value);
    }
    get lastSpherecast() {
      return this.ptr.readField(40, "f32").val();
    }
    set lastSpherecast(value) {
      return this.ptr.writeField(40, "f32", value);
    }
    get weaponParent() {
      return new Spring(this.ptr.readField(24, "i32"));
    }
    set weaponParent(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    ApplyRecoil() {
      window.ctx.call("MovementStateManager", "ApplyRecoil", [this.ptr]);
    }
    ApplyRecoilCustom(arg0) {
      window.ctx.call("MovementStateManager", "ApplyRecoilCustom", [this.ptr, arg0]);
    }
    InitRecoil(arg0, arg1) {
      window.ctx.call("MovementStateManager", "InitRecoil", [this.ptr, arg0, arg1]);
    }
    OnDisable() {
      window.ctx.call("MovementStateManager", "OnDisable", [this.ptr]);
    }
    OnEnable() {
      window.ctx.call("MovementStateManager", "OnEnable", [this.ptr]);
    }
    OnGroundedChange(arg0) {
      window.ctx.call("MovementStateManager", "OnGroundedChange", [this.ptr, arg0]);
    }
    Start() {
      window.ctx.call("MovementStateManager", "Start", [this.ptr]);
    }
    Update() {
      window.ctx.call("MovementStateManager", "Update", [this.ptr]);
    }
    UpdateMovementState(arg0) {
      window.ctx.call("MovementStateManager", "UpdateMovementState", [this.ptr, arg0]);
    }
  }
  class Spring {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get _smoothDampPositionVelocity() {
      return new Vector3(this.ptr.readField(32, "i32"));
    }
    set _smoothDampPositionVelocity(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get _smoothDampVelocityX() {
      return this.ptr.readField(44, "f32").val();
    }
    set _smoothDampVelocityX(value) {
      return this.ptr.writeField(44, "f32", value);
    }
    get _smoothDampVelocityY() {
      return this.ptr.readField(48, "f32").val();
    }
    set _smoothDampVelocityY(value) {
      return this.ptr.writeField(48, "f32", value);
    }
    get _smoothDampVelocityZ() {
      return this.ptr.readField(52, "f32").val();
    }
    set _smoothDampVelocityZ(value) {
      return this.ptr.writeField(52, "f32", value);
    }
    get bobblingMultiFromSettings() {
      return this.ptr.readField(0, "f32").val();
    }
    set bobblingMultiFromSettings(value) {
      return this.ptr.writeField(0, "f32", value);
    }
    get currentMovementState() {
      return this.ptr.readField(92, "i32");
    }
    set currentMovementState(value) {
      return this.ptr.writeField(92, "i32", value);
    }
    get handsHeightFromSettings() {
      return this.ptr.readField(4, "f32").val();
    }
    set handsHeightFromSettings(value) {
      return this.ptr.writeField(4, "f32", value);
    }
    get interpolationMethod() {
      return new SpringInterpolationMethod(this.ptr.readField(28, "i32"));
    }
    set interpolationMethod(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get isCamera() {
      return this.ptr.readField(16, "i32").val() === 1;
    }
    set isCamera(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get kinematicCharacterMotor() {
      return new KinematicCharacterMotor(this.ptr.readField(24, "i32"));
    }
    set kinematicCharacterMotor(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get lastPositionY() {
      return this.ptr.readField(112, "f32").val();
    }
    set lastPositionY(value) {
      return this.ptr.writeField(112, "f32", value);
    }
    get myShaker() {
      return new Shaker(this.ptr.readField(20, "i32"));
    }
    set myShaker(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get noiseOffsetX() {
      return this.ptr.readField(100, "f32").val();
    }
    set noiseOffsetX(value) {
      return this.ptr.writeField(100, "f32", value);
    }
    get noiseOffsetY() {
      return this.ptr.readField(104, "f32").val();
    }
    set noiseOffsetY(value) {
      return this.ptr.writeField(104, "f32", value);
    }
    get noiseOffsetZ() {
      return this.ptr.readField(108, "f32").val();
    }
    set noiseOffsetZ(value) {
      return this.ptr.writeField(108, "f32", value);
    }
    get recoilData() {
      return new RecoilData(this.ptr.readField(96, "i32"));
    }
    set recoilData(value) {
      return this.ptr.writeField(96, "i32", value);
    }
    get recoilForce() {
      return new Vector3(this.ptr.readField(68, "i32"));
    }
    set recoilForce(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get recoilRotationForce() {
      return new Vector3(this.ptr.readField(80, "i32"));
    }
    set recoilRotationForce(value) {
      return this.ptr.writeField(80, "i32", value);
    }
    get smoothVelocityY() {
      return this.ptr.readField(120, "f32").val();
    }
    set smoothVelocityY(value) {
      return this.ptr.writeField(120, "f32", value);
    }
    get velocity() {
      return new Vector3(this.ptr.readField(56, "i32"));
    }
    set velocity(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get velocityY() {
      return this.ptr.readField(116, "f32").val();
    }
    set velocityY(value) {
      return this.ptr.writeField(116, "f32", value);
    }
    ApplyPerlinNoise(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("Spring", "ApplyPerlinNoise", [out, this.ptr, arg0, arg1]);
        return out;
      })();
    }
    ApplyRecoil() {
      window.ctx.call("Spring", "ApplyRecoil", [this.ptr]);
    }
    ApplyRecoilCustom(arg0) {
      window.ctx.call("Spring", "ApplyRecoilCustom", [this.ptr, arg0]);
    }
    GetCurrentTransitionSpeed() {
      return window.ctx.call("Spring", "GetCurrentTransitionSpeed", [this.ptr]).val();
    }
    GetTargetPosition() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("Spring", "GetTargetPosition", [out, this.ptr]);
        return out;
      })();
    }
    GetTargetRotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("Spring", "GetTargetRotation", [out, this.ptr]);
        return out;
      })();
    }
    Initialize(arg0) {
      window.ctx.call("Spring", "Initialize", [this.ptr, arg0]);
    }
    OnDisable() {
      window.ctx.call("Spring", "OnDisable", [this.ptr]);
    }
    OnEnable() {
      window.ctx.call("Spring", "OnEnable", [this.ptr]);
    }
    OnSettingsChanged(arg0) {
      window.ctx.call("Spring", "OnSettingsChanged", [this.ptr, arg0]);
    }
    TransitionTo(arg0) {
      window.ctx.call("Spring", "TransitionTo", [this.ptr, arg0]);
    }
    Update() {
      window.ctx.call("Spring", "Update", [this.ptr]);
    }
  }
  class KinematicCharacterMotor {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get AttachedRigidbody() {
      return new Rigidbody(
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_AttachedRigidbody", [this.ptr]),
      );
    }
    get AttachedRigidbodyVelocity() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_AttachedRigidbodyVelocity", [
          out,
          this.ptr,
        ]);
        return out;
      })();
    }
    get CharacterForward() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_CharacterForward", [
          out,
          this.ptr,
        ]);
        return out;
      })();
    }
    get CharacterRight() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_CharacterRight", [out, this.ptr]);
        return out;
      })();
    }
    get CharacterTransformToCapsuleBottom() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call(
          "KinematicCharacterController.KinematicCharacterMotor",
          "get_CharacterTransformToCapsuleBottom",
          [out, this.ptr],
        );
        return out;
      })();
    }
    get CharacterTransformToCapsuleBottomHemi() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call(
          "KinematicCharacterController.KinematicCharacterMotor",
          "get_CharacterTransformToCapsuleBottomHemi",
          [out, this.ptr],
        );
        return out;
      })();
    }
    get CharacterTransformToCapsuleCenter() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call(
          "KinematicCharacterController.KinematicCharacterMotor",
          "get_CharacterTransformToCapsuleCenter",
          [out, this.ptr],
        );
        return out;
      })();
    }
    get CharacterTransformToCapsuleTop() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_CharacterTransformToCapsuleTop", [
          out,
          this.ptr,
        ]);
        return out;
      })();
    }
    get CharacterTransformToCapsuleTopHemi() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call(
          "KinematicCharacterController.KinematicCharacterMotor",
          "get_CharacterTransformToCapsuleTopHemi",
          [out, this.ptr],
        );
        return out;
      })();
    }
    get CharacterUp() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_CharacterUp", [out, this.ptr]);
        return out;
      })();
    }
    get InitialSimulationPosition() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_InitialSimulationPosition", [
          out,
          this.ptr,
        ]);
        return out;
      })();
    }
    get InitialSimulationRotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_InitialSimulationRotation", [
          out,
          this.ptr,
        ]);
        return out;
      })();
    }
    get Overlaps() {
      return window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_Overlaps", [this.ptr]);
    }
    get OverlapsCount() {
      return window.ctx
        .call("KinematicCharacterController.KinematicCharacterMotor", "get_OverlapsCount", [this.ptr])
        .val();
    }
    get Transform() {
      return new Transform(
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_Transform", [this.ptr]),
      );
    }
    get TransientPosition() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_TransientPosition", [
          out,
          this.ptr,
        ]);
        return out;
      })();
    }
    get TransientRotation() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_TransientRotation", [
          out,
          this.ptr,
        ]);
        return out;
      })();
    }
    set TransientRotation(value) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "set_TransientRotation", [
        this.ptr,
        value,
      ]);
    }
    get Velocity() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "get_Velocity", [out, this.ptr]);
        return out;
      })();
    }
    get AllowSteppingWithoutStableGrounding() {
      return this.ptr.readField(60, "i32").val() === 1;
    }
    set AllowSteppingWithoutStableGrounding(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get AttachedRigidbodyOverride() {
      return new Rigidbody(this.ptr.readField(428, "i32"));
    }
    set AttachedRigidbodyOverride(value) {
      return this.ptr.writeField(428, "i32", value);
    }
    get BaseVelocity() {
      return new Vector3(this.ptr.readField(432, "i32"));
    }
    set BaseVelocity(value) {
      return this.ptr.writeField(432, "i32", value);
    }
    get Capsule() {
      return new CapsuleCollider(this.ptr.readField(16, "i32"));
    }
    set Capsule(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get CapsuleHeight() {
      return this.ptr.readField(24, "f32").val();
    }
    set CapsuleHeight(value) {
      return this.ptr.writeField(24, "f32", value);
    }
    get CapsulePhysicsMaterial() {
      return new PhysicsMaterial(this.ptr.readField(32, "i32"));
    }
    set CapsulePhysicsMaterial(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get CapsuleRadius() {
      return this.ptr.readField(20, "f32").val();
    }
    set CapsuleRadius(value) {
      return this.ptr.writeField(20, "f32", value);
    }
    get CapsuleYOffset() {
      return this.ptr.readField(28, "f32").val();
    }
    set CapsuleYOffset(value) {
      return this.ptr.writeField(28, "f32", value);
    }
    get CharacterController() {
      return new ICharacterController(this.ptr.readField(388, "i32"));
    }
    set CharacterController(value) {
      return this.ptr.writeField(388, "i32", value);
    }
    get CheckMovementInitialOverlaps() {
      return this.ptr.readField(120, "i32").val() === 1;
    }
    set CheckMovementInitialOverlaps(value) {
      return this.ptr.writeField(120, "i32", value);
    }
    get CollidableLayers() {
      return new LayerMask(this.ptr.readField(220, "i32"));
    }
    set CollidableLayers(value) {
      return this.ptr.writeField(220, "i32", value);
    }
    get DiscreteCollisionEvents() {
      return this.ptr.readField(48, "i32").val() === 1;
    }
    set DiscreteCollisionEvents(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    get GroundDetectionExtraDistance() {
      return this.ptr.readField(36, "f32").val();
    }
    set GroundDetectionExtraDistance(value) {
      return this.ptr.writeField(36, "f32", value);
    }
    get GroundingStatus() {
      return new CharacterGroundingReport(this.ptr.readField(124, "i32"));
    }
    set GroundingStatus(value) {
      return this.ptr.writeField(124, "i32", value);
    }
    get HasPlanarConstraint() {
      return this.ptr.readField(97, "i32").val() === 1;
    }
    set HasPlanarConstraint(value) {
      return this.ptr.writeField(97, "i32", value);
    }
    get IndexInCharacterSystem() {
      return this.ptr.readField(396, "i32").val();
    }
    set IndexInCharacterSystem(value) {
      return this.ptr.writeField(396, "i32", value);
    }
    get InitialTickPosition() {
      return new Vector3(this.ptr.readField(400, "i32"));
    }
    set InitialTickPosition(value) {
      return this.ptr.writeField(400, "i32", value);
    }
    get InitialTickRotation() {
      return new Quaternion(this.ptr.readField(412, "i32"));
    }
    set InitialTickRotation(value) {
      return this.ptr.writeField(412, "i32", value);
    }
    get InteractiveRigidbodyHandling() {
      return this.ptr.readField(84, "i32").val() === 1;
    }
    set InteractiveRigidbodyHandling(value) {
      return this.ptr.writeField(84, "i32", value);
    }
    get KillRemainingMovementWhenExceedMaxMovementIterations() {
      return this.ptr.readField(122, "i32").val() === 1;
    }
    set KillRemainingMovementWhenExceedMaxMovementIterations(value) {
      return this.ptr.writeField(122, "i32", value);
    }
    get KillVelocityWhenExceedMaxMovementIterations() {
      return this.ptr.readField(121, "i32").val() === 1;
    }
    set KillVelocityWhenExceedMaxMovementIterations(value) {
      return this.ptr.writeField(121, "i32", value);
    }
    get LastGroundingStatus() {
      return new CharacterTransientGroundingReport(this.ptr.readField(180, "i32"));
    }
    set LastGroundingStatus(value) {
      return this.ptr.writeField(180, "i32", value);
    }
    get LastMovementIterationFoundAnyGround() {
      return this.ptr.readField(392, "i32").val() === 1;
    }
    set LastMovementIterationFoundAnyGround(value) {
      return this.ptr.writeField(392, "i32", value);
    }
    get LedgeAndDenivelationHandling() {
      return this.ptr.readField(68, "i32").val() === 1;
    }
    set LedgeAndDenivelationHandling(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get MaxDecollisionIterations() {
      return this.ptr.readField(116, "i32").val();
    }
    set MaxDecollisionIterations(value) {
      return this.ptr.writeField(116, "i32", value);
    }
    get MaxMovementIterations() {
      return this.ptr.readField(112, "i32").val();
    }
    set MaxMovementIterations(value) {
      return this.ptr.writeField(112, "i32", value);
    }
    get MaxStableDenivelationAngle() {
      return this.ptr.readField(80, "f32").val();
    }
    set MaxStableDenivelationAngle(value) {
      return this.ptr.writeField(80, "f32", value);
    }
    get MaxStableDistanceFromLedge() {
      return this.ptr.readField(72, "f32").val();
    }
    set MaxStableDistanceFromLedge(value) {
      return this.ptr.writeField(72, "f32", value);
    }
    get MaxStableSlopeAngle() {
      return this.ptr.readField(40, "f32").val();
    }
    set MaxStableSlopeAngle(value) {
      return this.ptr.writeField(40, "f32", value);
    }
    get MaxStepHeight() {
      return this.ptr.readField(56, "f32").val();
    }
    set MaxStepHeight(value) {
      return this.ptr.writeField(56, "f32", value);
    }
    get MaxVelocityForLedgeSnap() {
      return this.ptr.readField(76, "f32").val();
    }
    set MaxVelocityForLedgeSnap(value) {
      return this.ptr.writeField(76, "f32", value);
    }
    get MinRequiredStepDepth() {
      return this.ptr.readField(64, "f32").val();
    }
    set MinRequiredStepDepth(value) {
      return this.ptr.writeField(64, "f32", value);
    }
    get PlanarConstraintAxis() {
      return new Vector3(this.ptr.readField(100, "i32"));
    }
    set PlanarConstraintAxis(value) {
      return this.ptr.writeField(100, "i32", value);
    }
    get PreserveAttachedRigidbodyMomentum() {
      return this.ptr.readField(96, "i32").val() === 1;
    }
    set PreserveAttachedRigidbodyMomentum(value) {
      return this.ptr.writeField(96, "i32", value);
    }
    get RigidbodyInteractionType() {
      return new RigidbodyInteractionType(this.ptr.readField(88, "i32"));
    }
    set RigidbodyInteractionType(value) {
      return this.ptr.writeField(88, "i32", value);
    }
    get SimulatedCharacterMass() {
      return this.ptr.readField(92, "f32").val();
    }
    set SimulatedCharacterMass(value) {
      return this.ptr.writeField(92, "f32", value);
    }
    get StableGroundLayers() {
      return new LayerMask(this.ptr.readField(44, "i32"));
    }
    set StableGroundLayers(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get StepHandling() {
      return new StepHandlingMethod(this.ptr.readField(52, "i32"));
    }
    set StepHandling(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get _attachedRigidbody() {
      return new Rigidbody(this.ptr.readField(304, "i32"));
    }
    set _attachedRigidbody(value) {
      return this.ptr.writeField(304, "i32", value);
    }
    get _attachedRigidbodyVelocity() {
      return new Vector3(this.ptr.readField(368, "i32"));
    }
    set _attachedRigidbodyVelocity(value) {
      return this.ptr.writeField(368, "i32", value);
    }
    get _cachedWorldForward() {
      return new Vector3(this.ptr.readField(520, "i32"));
    }
    set _cachedWorldForward(value) {
      return this.ptr.writeField(520, "i32", value);
    }
    get _cachedWorldRight() {
      return new Vector3(this.ptr.readField(532, "i32"));
    }
    set _cachedWorldRight(value) {
      return this.ptr.writeField(532, "i32", value);
    }
    get _cachedWorldUp() {
      return new Vector3(this.ptr.readField(508, "i32"));
    }
    set _cachedWorldUp(value) {
      return this.ptr.writeField(508, "i32", value);
    }
    get _cachedZeroVector() {
      return new Vector3(this.ptr.readField(544, "i32"));
    }
    set _cachedZeroVector(value) {
      return this.ptr.writeField(544, "i32", value);
    }
    get _characterForward() {
      return new Vector3(this.ptr.readField(252, "i32"));
    }
    set _characterForward(value) {
      return this.ptr.writeField(252, "i32", value);
    }
    get _characterRight() {
      return new Vector3(this.ptr.readField(264, "i32"));
    }
    set _characterRight(value) {
      return this.ptr.writeField(264, "i32", value);
    }
    get _characterTransformToCapsuleBottom() {
      return new Vector3(this.ptr.readField(320, "i32"));
    }
    set _characterTransformToCapsuleBottom(value) {
      return this.ptr.writeField(320, "i32", value);
    }
    get _characterTransformToCapsuleBottomHemi() {
      return new Vector3(this.ptr.readField(344, "i32"));
    }
    set _characterTransformToCapsuleBottomHemi(value) {
      return this.ptr.writeField(344, "i32", value);
    }
    get _characterTransformToCapsuleCenter() {
      return new Vector3(this.ptr.readField(308, "i32"));
    }
    set _characterTransformToCapsuleCenter(value) {
      return this.ptr.writeField(308, "i32", value);
    }
    get _characterTransformToCapsuleTop() {
      return new Vector3(this.ptr.readField(332, "i32"));
    }
    set _characterTransformToCapsuleTop(value) {
      return this.ptr.writeField(332, "i32", value);
    }
    get _characterTransformToCapsuleTopHemi() {
      return new Vector3(this.ptr.readField(356, "i32"));
    }
    set _characterTransformToCapsuleTopHemi(value) {
      return this.ptr.writeField(356, "i32", value);
    }
    get _characterUp() {
      return new Vector3(this.ptr.readField(240, "i32"));
    }
    set _characterUp(value) {
      return this.ptr.writeField(240, "i32", value);
    }
    get _initialSimulationPosition() {
      return new Vector3(this.ptr.readField(276, "i32"));
    }
    set _initialSimulationPosition(value) {
      return this.ptr.writeField(276, "i32", value);
    }
    get _initialSimulationRotation() {
      return new Quaternion(this.ptr.readField(288, "i32"));
    }
    set _initialSimulationRotation(value) {
      return this.ptr.writeField(288, "i32", value);
    }
    get _internalCharacterHits() {
      return JSArray(this.ptr.readField(444, "i32"));
    }
    set _internalCharacterHits(value) {
      return this.ptr.writeField(444, "i32", value);
    }
    get _internalProbedColliders() {
      return JSArray(this.ptr.readField(448, "i32"));
    }
    set _internalProbedColliders(value) {
      return this.ptr.writeField(448, "i32", value);
    }
    get _internalRigidbodyProjectionHits() {
      return JSArray(this.ptr.readField(456, "i32"));
    }
    set _internalRigidbodyProjectionHits(value) {
      return this.ptr.writeField(456, "i32", value);
    }
    get _isMovingFromAttachedRigidbody() {
      return this.ptr.readField(500, "i32").val() === 1;
    }
    set _isMovingFromAttachedRigidbody(value) {
      return this.ptr.writeField(500, "i32", value);
    }
    get _lastAttachedRigidbody() {
      return new Rigidbody(this.ptr.readField(460, "i32"));
    }
    set _lastAttachedRigidbody(value) {
      return this.ptr.writeField(460, "i32", value);
    }
    get _lastSolvedOverlapNormal() {
      return new Vector3(this.ptr.readField(484, "i32"));
    }
    set _lastSolvedOverlapNormal(value) {
      return this.ptr.writeField(484, "i32", value);
    }
    get _lastSolvedOverlapNormalDirty() {
      return this.ptr.readField(480, "i32").val() === 1;
    }
    set _lastSolvedOverlapNormalDirty(value) {
      return this.ptr.writeField(480, "i32", value);
    }
    get _movePositionDirty() {
      return this.ptr.readField(466, "i32").val() === 1;
    }
    set _movePositionDirty(value) {
      return this.ptr.writeField(466, "i32", value);
    }
    get _movePositionTarget() {
      return new Vector3(this.ptr.readField(468, "i32"));
    }
    set _movePositionTarget(value) {
      return this.ptr.writeField(468, "i32", value);
    }
    get _mustUnground() {
      return this.ptr.readField(501, "i32").val() === 1;
    }
    set _mustUnground(value) {
      return this.ptr.writeField(501, "i32", value);
    }
    get _mustUngroundTimeCounter() {
      return this.ptr.readField(504, "f32").val();
    }
    set _mustUngroundTimeCounter(value) {
      return this.ptr.writeField(504, "f32", value);
    }
    get _overlaps() {
      return JSArray(this.ptr.readField(384, "i32"));
    }
    set _overlaps(value) {
      return this.ptr.writeField(384, "i32", value);
    }
    get _overlapsCount() {
      return this.ptr.readField(380, "i32").val();
    }
    set _overlapsCount(value) {
      return this.ptr.writeField(380, "i32", value);
    }
    get _rigidbodiesPushedThisMove() {
      return this.ptr.readField(452, "i32");
    }
    set _rigidbodiesPushedThisMove(value) {
      return this.ptr.writeField(452, "i32", value);
    }
    get _rigidbodyProjectionHitCount() {
      return this.ptr.readField(496, "i32").val();
    }
    set _rigidbodyProjectionHitCount(value) {
      return this.ptr.writeField(496, "i32", value);
    }
    get _solveGrounding() {
      return this.ptr.readField(465, "i32").val() === 1;
    }
    set _solveGrounding(value) {
      return this.ptr.writeField(465, "i32", value);
    }
    get _solveMovementCollisions() {
      return this.ptr.readField(464, "i32").val() === 1;
    }
    set _solveMovementCollisions(value) {
      return this.ptr.writeField(464, "i32", value);
    }
    get _transform() {
      return new Transform(this.ptr.readField(224, "i32"));
    }
    set _transform(value) {
      return this.ptr.writeField(224, "i32", value);
    }
    get _transientPosition() {
      return new Vector3(this.ptr.readField(228, "i32"));
    }
    set _transientPosition(value) {
      return this.ptr.writeField(228, "i32", value);
    }
    get _transientRotation() {
      return new Quaternion(this.ptr.readField(556, "i32"));
    }
    set _transientRotation(value) {
      return this.ptr.writeField(556, "i32", value);
    }
    ApplyState(arg0, arg1) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "ApplyState", [this.ptr, arg0, arg1]);
    }
    Awake() {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "Awake", [this.ptr]);
    }
    CharacterCollisionsOverlap(arg0, arg1, arg2, arg3, arg4) {
      return window.ctx
        .call("KinematicCharacterController.KinematicCharacterMotor", "CharacterCollisionsOverlap", [
          this.ptr,
          arg0,
          arg1,
          arg2,
          arg3,
          arg4,
        ])
        .val();
    }
    CharacterCollisionsRaycast(arg0, arg1, arg2, arg3, arg4, arg5) {
      return window.ctx
        .call("KinematicCharacterController.KinematicCharacterMotor", "CharacterCollisionsRaycast", [
          this.ptr,
          arg0,
          arg1,
          arg2,
          arg3,
          arg4,
          arg5,
        ])
        .val();
    }
    CharacterCollisionsSweep(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
      return window.ctx
        .call("KinematicCharacterController.KinematicCharacterMotor", "CharacterCollisionsSweep", [
          this.ptr,
          arg0,
          arg1,
          arg2,
          arg3,
          arg4,
          arg5,
          arg6,
          arg7,
        ])
        .val();
    }
    CharacterGroundSweep(arg0, arg1, arg2, arg3, arg4) {
      return (
        window.ctx
          .call("KinematicCharacterController.KinematicCharacterMotor", "CharacterGroundSweep", [
            this.ptr,
            arg0,
            arg1,
            arg2,
            arg3,
            arg4,
          ])
          .val() === 1
      );
    }
    CharacterOverlap(arg0, arg1, arg2, arg3, arg4, arg5) {
      return window.ctx
        .call("KinematicCharacterController.KinematicCharacterMotor", "CharacterOverlap", [
          this.ptr,
          arg0,
          arg1,
          arg2,
          arg3,
          arg4,
          arg5,
        ])
        .val();
    }
    CharacterSweep(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
      return window.ctx
        .call("KinematicCharacterController.KinematicCharacterMotor", "CharacterSweep", [
          this.ptr,
          arg0,
          arg1,
          arg2,
          arg3,
          arg4,
          arg5,
          arg6,
          arg7,
          arg8,
        ])
        .val();
    }
    CheckIfColliderValidForCollisions(arg0) {
      return (
        window.ctx
          .call("KinematicCharacterController.KinematicCharacterMotor", "CheckIfColliderValidForCollisions", [
            this.ptr,
            arg0,
          ])
          .val() === 1
      );
    }
    CheckStepValidity(arg0, arg1, arg2, arg3, arg4, arg5) {
      return (
        window.ctx
          .call("KinematicCharacterController.KinematicCharacterMotor", "CheckStepValidity", [
            this.ptr,
            arg0,
            arg1,
            arg2,
            arg3,
            arg4,
            arg5,
          ])
          .val() === 1
      );
    }
    ComputeCollisionResolutionForHitBody(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "ComputeCollisionResolutionForHitBody", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
      ]);
    }
    DetectSteps(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "DetectSteps", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
      ]);
    }
    EvaluateCrease(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "EvaluateCrease", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
        arg8,
      ]);
    }
    EvaluateHitStability(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "EvaluateHitStability", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
      ]);
    }
    ForceUnground(arg0) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "ForceUnground", [this.ptr, arg0]);
    }
    GetDirectionTangentToSurface(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "GetDirectionTangentToSurface", [
          out,
          this.ptr,
          arg0,
          arg1,
        ]);
        return out;
      })();
    }
    GetInteractiveRigidbody(arg0) {
      return new Rigidbody(
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "GetInteractiveRigidbody", [
          this.ptr,
          arg0,
        ]),
      );
    }
    GetObstructionNormal(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "GetObstructionNormal", [
          out,
          this.ptr,
          arg0,
          arg1,
        ]);
        return out;
      })();
    }
    GetState() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "GetState", [out, this.ptr]);
        return out;
      })();
    }
    GetVelocityForMovePosition(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "GetVelocityForMovePosition", [
          out,
          this.ptr,
          arg0,
          arg1,
          arg2,
        ]);
        return out;
      })();
    }
    GetVelocityFromMovement(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "GetVelocityFromMovement", [
          out,
          this.ptr,
          arg0,
          arg1,
        ]);
        return out;
      })();
    }
    GetVelocityFromRigidbodyMovement(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "GetVelocityFromRigidbodyMovement", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
      ]);
    }
    HandleRemoveComponent() {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "HandleRemoveComponent", [this.ptr]);
    }
    HandleSimulatedRigidbodyInteraction(arg0, arg1, arg2) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "HandleSimulatedRigidbodyInteraction", [
        this.ptr,
        arg0,
        arg1,
        arg2,
      ]);
    }
    HandleVelocityProjection(arg0, arg1, arg2) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "HandleVelocityProjection", [
        this.ptr,
        arg0,
        arg1,
        arg2,
      ]);
    }
    InternalCharacterMove(arg0, arg1) {
      return (
        window.ctx
          .call("KinematicCharacterController.KinematicCharacterMotor", "InternalCharacterMove", [this.ptr, arg0, arg1])
          .val() === 1
      );
    }
    InternalHandleVelocityProjection(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "InternalHandleVelocityProjection", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
        arg8,
        arg9,
        arg10,
      ]);
    }
    InternalIsColliderValidForCollisions(arg0) {
      return (
        window.ctx
          .call("KinematicCharacterController.KinematicCharacterMotor", "InternalIsColliderValidForCollisions", [
            this.ptr,
            arg0,
          ])
          .val() === 1
      );
    }
    IsStableOnNormal(arg0) {
      return (
        window.ctx
          .call("KinematicCharacterController.KinematicCharacterMotor", "IsStableOnNormal", [this.ptr, arg0])
          .val() === 1
      );
    }
    IsStableWithSpecialCases(arg0, arg1) {
      return (
        window.ctx
          .call("KinematicCharacterController.KinematicCharacterMotor", "IsStableWithSpecialCases", [
            this.ptr,
            arg0,
            arg1,
          ])
          .val() === 1
      );
    }
    MoveCharacter(arg0) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "MoveCharacter", [this.ptr, arg0]);
    }
    MustUnground() {
      return (
        window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "MustUnground", [this.ptr]).val() === 1
      );
    }
    OnDisable() {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "OnDisable", [this.ptr]);
    }
    OnEnable() {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "OnEnable", [this.ptr]);
    }
    OnValidate() {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "OnValidate", [this.ptr]);
    }
    ProbeGround(arg0, arg1, arg2, arg3) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "ProbeGround", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
      ]);
    }
    ProcessVelocityForRigidbodyHits(arg0, arg1) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "ProcessVelocityForRigidbodyHits", [
        this.ptr,
        arg0,
        arg1,
      ]);
    }
    Reset() {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "Reset", [this.ptr]);
    }
    RestrictVectorToPlane(arg0, arg1) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "RestrictVectorToPlane", [
        this.ptr,
        arg0,
        arg1,
      ]);
    }
    SetCapsuleCollisionsActivation(arg0) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "SetCapsuleCollisionsActivation", [
        this.ptr,
        arg0,
      ]);
    }
    SetCapsuleDimensions(arg0, arg1, arg2) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "SetCapsuleDimensions", [
        this.ptr,
        arg0,
        arg1,
        arg2,
      ]);
    }
    SetGroundSolvingActivation(arg0) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "SetGroundSolvingActivation", [
        this.ptr,
        arg0,
      ]);
    }
    SetMovementCollisionsSolvingActivation(arg0) {
      window.ctx.call(
        "KinematicCharacterController.KinematicCharacterMotor",
        "SetMovementCollisionsSolvingActivation",
        [this.ptr, arg0],
      );
    }
    SetPosition(arg0, arg1) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "SetPosition", [this.ptr, arg0, arg1]);
    }
    SetPositionAndRotation(arg0, arg1, arg2) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "SetPositionAndRotation", [
        this.ptr,
        arg0,
        arg1,
        arg2,
      ]);
    }
    SetTransientPosition(arg0) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "SetTransientPosition", [this.ptr, arg0]);
    }
    StoreRigidbodyHit(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "StoreRigidbodyHit", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
      ]);
    }
    Update() {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "Update", [this.ptr]);
    }
    UpdatePhase1(arg0) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "UpdatePhase1", [this.ptr, arg0]);
    }
    UpdatePhase2(arg0) {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "UpdatePhase2", [this.ptr, arg0]);
    }
    ValidateData() {
      window.ctx.call("KinematicCharacterController.KinematicCharacterMotor", "ValidateData", [this.ptr]);
    }
  }
  class Quaternion {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get eulerAngles() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Quaternion", "get_eulerAngles", [out, this.ptr]);
        return out;
      })();
    }
    static get identity() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "get_identity", [out]);
        return out;
      })();
    }
    get identityQuaternion() {
      return new Quaternion(this.ptr.readField(0, "i32"));
    }
    set identityQuaternion(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get w() {
      return this.ptr.readField(12, "f32").val();
    }
    set w(value) {
      return this.ptr.writeField(12, "f32", value);
    }
    get x() {
      return this.ptr.readField(0, "f32").val();
    }
    set x(value) {
      return this.ptr.writeField(0, "f32", value);
    }
    get y() {
      return this.ptr.readField(4, "f32").val();
    }
    set y(value) {
      return this.ptr.writeField(4, "f32", value);
    }
    get z() {
      return this.ptr.readField(8, "f32").val();
    }
    set z(value) {
      return this.ptr.writeField(8, "f32", value);
    }
    static Angle(arg0, arg1) {
      return window.ctx.call("UnityEngine.Quaternion", "Angle", [arg0, arg1]).val();
    }
    static AngleAxis(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "AngleAxis", [out, arg0, arg1]);
        return out;
      })();
    }
    static Dot(arg0, arg1) {
      return window.ctx.call("UnityEngine.Quaternion", "Dot", [arg0, arg1]).val();
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.Quaternion", "Equals_23426", [this.ptr, other]).val() === 1;
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.Quaternion", "Equals_23427", [this.ptr, other]).val() === 1;
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.Quaternion", "Equals_23428", [this.ptr, other]).val() === 1;
    }
    static Euler_x_y_z(x, y, z) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Euler_23423", [out, x, y, z]);
        return out;
      })();
    }
    static Euler_euler(euler) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Euler_23424", [out, euler]);
        return out;
      })();
    }
    static FromToRotation(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "FromToRotation", [out, arg0, arg1]);
        return out;
      })();
    }
    GetHashCode() {
      return window.ctx.call("UnityEngine.Quaternion", "GetHashCode", [this.ptr]).val();
    }
    static Internal_AngleAxis(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Internal_AngleAxis", [out, arg0, arg1]);
        return out;
      })();
    }
    static Internal_AngleAxis_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Quaternion", "Internal_AngleAxis_Injected", [arg0, arg1, arg2]);
    }
    static Internal_FromEulerRad(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Internal_FromEulerRad", [out, arg0]);
        return out;
      })();
    }
    static Internal_FromEulerRad_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Quaternion", "Internal_FromEulerRad_Injected", [arg0, arg1]);
    }
    static Internal_FromToRotation(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Internal_FromToRotation", [out, arg0, arg1]);
        return out;
      })();
    }
    static Internal_FromToRotation_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Quaternion", "Internal_FromToRotation_Injected", [arg0, arg1, arg2]);
    }
    static Internal_Inverse(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Internal_Inverse", [out, arg0]);
        return out;
      })();
    }
    static Internal_Inverse_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Quaternion", "Internal_Inverse_Injected", [arg0, arg1]);
    }
    static Internal_Lerp(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Internal_Lerp", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static Internal_Lerp_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Quaternion", "Internal_Lerp_Injected", [arg0, arg1, arg2, arg3]);
    }
    static Internal_LookRotation(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Internal_LookRotation", [out, arg0, arg1]);
        return out;
      })();
    }
    static Internal_LookRotation_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Quaternion", "Internal_LookRotation_Injected", [arg0, arg1, arg2]);
    }
    static Internal_MakePositive(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Quaternion", "Internal_MakePositive", [out, arg0]);
        return out;
      })();
    }
    static Internal_Slerp(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Internal_Slerp", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static Internal_Slerp_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Quaternion", "Internal_Slerp_Injected", [arg0, arg1, arg2, arg3]);
    }
    static Internal_ToEulerRad(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.Quaternion", "Internal_ToEulerRad", [out, arg0]);
        return out;
      })();
    }
    static Internal_ToEulerRad_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Quaternion", "Internal_ToEulerRad_Injected", [arg0, arg1]);
    }
    static Inverse(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Inverse", [out, arg0]);
        return out;
      })();
    }
    static IsEqualUsingDot(arg0) {
      return window.ctx.call("UnityEngine.Quaternion", "IsEqualUsingDot", [arg0]).val() === 1;
    }
    static Lerp(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Lerp", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static LookRotation_forward_upwards(forwardValue, upwards) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "LookRotation_23410", [out, forwardValue, upwards]);
        return out;
      })();
    }
    static LookRotation_forward(forwardValue) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "LookRotation_23411", [out, forwardValue]);
        return out;
      })();
    }
    static Slerp(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Quaternion", "Slerp", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    ToString_pointer() {
      return window.ctx.call("UnityEngine.Quaternion", "ToString_23429", [this.ptr]);
    }
    ToString_format_formatProvider(format, formatProvider) {
      return window.ctx.call("UnityEngine.Quaternion", "ToString_23430", [this.ptr, format, formatProvider]);
    }
  }
  class BoxCollider {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get center() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.BoxCollider", "get_center", [out, this.ptr]);
        return out;
      })();
    }
    set center(value) {
      window.ctx.call("UnityEngine.BoxCollider", "set_center", [this.ptr, value]);
    }
    get size() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.BoxCollider", "get_size", [out, this.ptr]);
        return out;
      })();
    }
    set size(value) {
      window.ctx.call("UnityEngine.BoxCollider", "set_size", [this.ptr, value]);
    }
    static get_center_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.BoxCollider", "get_center_Injected", [arg0, arg1]);
    }
    static get_size_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.BoxCollider", "get_size_Injected", [arg0, arg1]);
    }
    static set_center_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.BoxCollider", "set_center_Injected", [arg0, arg1]);
    }
    static set_size_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.BoxCollider", "set_size_Injected", [arg0, arg1]);
    }
  }
  class CharacterGroundingReport {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get FoundAnyGround() {
      return this.ptr.readField(0, "i32").val() === 1;
    }
    set FoundAnyGround(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get GroundCollider() {
      return new Collider(this.ptr.readField(40, "i32"));
    }
    set GroundCollider(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get GroundNormal() {
      return new Vector3(this.ptr.readField(4, "i32"));
    }
    set GroundNormal(value) {
      return this.ptr.writeField(4, "i32", value);
    }
    get GroundPoint() {
      return new Vector3(this.ptr.readField(44, "i32"));
    }
    set GroundPoint(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get InnerGroundNormal() {
      return new Vector3(this.ptr.readField(16, "i32"));
    }
    set InnerGroundNormal(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get IsStableOnGround() {
      return this.ptr.readField(1, "i32").val() === 1;
    }
    set IsStableOnGround(value) {
      return this.ptr.writeField(1, "i32", value);
    }
    get OuterGroundNormal() {
      return new Vector3(this.ptr.readField(28, "i32"));
    }
    set OuterGroundNormal(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get SnappingPrevented() {
      return this.ptr.readField(2, "i32").val() === 1;
    }
    set SnappingPrevented(value) {
      return this.ptr.writeField(2, "i32", value);
    }
    CopyFrom(arg0) {
      window.ctx.call("KinematicCharacterController.CharacterGroundingReport", "CopyFrom", [this.ptr, arg0]);
    }
  }
  class RigidbodyCollisionDetectionMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class RigidbodyConstraints {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class RigidbodyInterpolation {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ColyAI {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get botParams() {
      return this.ptr.readField(80, "i32");
    }
    set botParams(value) {
      return this.ptr.writeField(80, "i32", value);
    }
    get currentState() {
      return this.ptr.readField(20, "i32");
    }
    set currentState(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get currentTarget() {
      return new ColyView(this.ptr.readField(64, "i32"));
    }
    set currentTarget(value) {
      return this.ptr.writeField(64, "i32", value);
    }
    get currentWaypointIndex() {
      return this.ptr.readField(60, "i32").val();
    }
    set currentWaypointIndex(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get jumpInput() {
      return this.ptr.readField(52, "i32").val() === 1;
    }
    set jumpInput(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get lastFoundTargetTime() {
      return this.ptr.readField(136, "f32").val();
    }
    set lastFoundTargetTime(value) {
      return this.ptr.writeField(136, "f32", value);
    }
    get lastTickCycle() {
      return this.ptr.readField(32, "i32").val();
    }
    set lastTickCycle(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get messageSentThisLife() {
      return this.ptr.readField(128, "i32").val() === 1;
    }
    set messageSentThisLife(value) {
      return this.ptr.writeField(128, "i32", value);
    }
    get movementInput() {
      return new Vector3(this.ptr.readField(36, "i32"));
    }
    set movementInput(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get neckController() {
      return new NeckController(this.ptr.readField(124, "i32"));
    }
    set neckController(value) {
      return this.ptr.writeField(124, "i32", value);
    }
    get neckXRot() {
      return this.ptr.readField(132, "f32").val();
    }
    set neckXRot(value) {
      return this.ptr.writeField(132, "f32", value);
    }
    get nextFireTime() {
      return this.ptr.readField(140, "f32").val();
    }
    set nextFireTime(value) {
      return this.ptr.writeField(140, "f32", value);
    }
    get normalizedExecutionTime() {
      return this.ptr.readField(28, "f32").val();
    }
    set normalizedExecutionTime(value) {
      return this.ptr.writeField(28, "f32", value);
    }
    get obstacleLayer() {
      return new LayerMask(this.ptr.readField(72, "i32"));
    }
    set obstacleLayer(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get patrolPoints() {
      return JSArray(this.ptr.readField(56, "i32"));
    }
    set patrolPoints(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get playstyle() {
      return this.ptr.readField(24, "i32");
    }
    set playstyle(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get rotationSpeed() {
      return this.ptr.readField(76, "f32").val();
    }
    set rotationSpeed(value) {
      return this.ptr.writeField(76, "f32", value);
    }
    get slideInput() {
      return this.ptr.readField(53, "i32").val() === 1;
    }
    set slideInput(value) {
      return this.ptr.writeField(53, "i32", value);
    }
    get targetLayer() {
      return new LayerMask(this.ptr.readField(68, "i32"));
    }
    set targetLayer(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get targetYRotation() {
      return this.ptr.readField(48, "f32").val();
    }
    set targetYRotation(value) {
      return this.ptr.writeField(48, "f32", value);
    }
    Attack() {
      window.ctx.call("ColyAI", "Attack", [this.ptr]);
    }
    Chase() {
      window.ctx.call("ColyAI", "Chase", [this.ptr]);
    }
    ChatTick() {
      window.ctx.call("ColyAI", "ChatTick", [this.ptr]);
    }
    EvaluateState() {
      window.ctx.call("ColyAI", "EvaluateState", [this.ptr]);
    }
    EvaluateTargets() {
      window.ctx.call("ColyAI", "EvaluateTargets", [this.ptr]);
    }
    GetParametersForPlaystyle(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("ColyAI", "GetParametersForPlaystyle", [out, this.ptr, arg0]);
        return out;
      })();
    }
    InitAI(arg0, arg1, arg2) {
      window.ctx.call("ColyAI", "InitAI", [this.ptr, arg0, arg1, arg2]);
    }
    OnDrawGizmos() {
      window.ctx.call("ColyAI", "OnDrawGizmos", [this.ptr]);
    }
    OnNetworkSpawned(arg0) {
      window.ctx.call("ColyAI", "OnNetworkSpawned", [this.ptr, arg0]);
    }
    Patrol() {
      window.ctx.call("ColyAI", "Patrol", [this.ptr]);
    }
    SendChatMessage(arg0) {
      window.ctx.call("ColyAI", "SendChatMessage", [this.ptr, arg0]);
    }
    SetState(arg0) {
      window.ctx.call("ColyAI", "SetState", [this.ptr, arg0]);
    }
    Update() {
      window.ctx.call("ColyAI", "Update", [this.ptr]);
    }
  }
  class PlayerCardInfo {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get eliminatedTxt() {
      return this.ptr.readField(36, "i32");
    }
    set eliminatedTxt(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get nicknameTxt() {
      return this.ptr.readField(16, "i32");
    }
    set nicknameTxt(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get pfpFrame() {
      return new PfpFrame(this.ptr.readField(40, "i32"));
    }
    set pfpFrame(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get playerSince() {
      return this.ptr.readField(24, "i32");
    }
    set playerSince(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get serverKillerPfp() {
      return new Sprite(this.ptr.readField(32, "i32"));
    }
    set serverKillerPfp(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get usernameTxt() {
      return this.ptr.readField(20, "i32");
    }
    set usernameTxt(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get weaponRenderImage() {
      return new UIImage(this.ptr.readField(28, "i32"));
    }
    set weaponRenderImage(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    Init(arg0) {
      window.ctx.call("PlayerCardInfo", "Init", [this.ptr, arg0]);
    }
    Update() {
      window.ctx.call("PlayerCardInfo", "Update", [this.ptr]);
    }
  }
  class RotationOrder {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ColyseusClient {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get Settings() {
      return new ColyseusSettings(window.ctx.call("Colyseus.ColyseusClient", "get_Settings", [this.ptr]));
    }
    set Settings(value) {
      window.ctx.call("Colyseus.ColyseusClient", "set_Settings", [this.ptr, value]);
    }
    get Auth() {
      return new Auth(this.ptr.readField(8, "i32"));
    }
    set Auth(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    get Endpoint() {
      return this.ptr.readField(12, "i32");
    }
    set Endpoint(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get Http() {
      return new HTTP(this.ptr.readField(16, "i32"));
    }
    set Http(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get _colyseusSettings() {
      return new ColyseusSettings(this.ptr.readField(20, "i32"));
    }
    set _colyseusSettings(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    ConsumeSeatReservation(arg0, arg1, arg2) {
      return window.ctx.call("Colyseus.ColyseusClient", "ConsumeSeatReservation", [this.ptr, arg0, arg1, arg2]);
    }
    Create(arg0, arg1, arg2) {
      return window.ctx.call("Colyseus.ColyseusClient", "Create", [this.ptr, arg0, arg1, arg2]);
    }
    Create_roomName_options_headers(roomName, options, headers) {
      return window.ctx.call("Colyseus.ColyseusClient", "Create_13162", [this.ptr, roomName, options, headers]);
    }
    CreateConnection(arg0, arg1, arg2) {
      return new ColyseusConnection(
        window.ctx.call("Colyseus.ColyseusClient", "CreateConnection", [this.ptr, arg0, arg1, arg2]),
      );
    }
    CreateMatchMakeRequest(arg0, arg1, arg2, arg3) {
      return window.ctx.call("Colyseus.ColyseusClient", "CreateMatchMakeRequest", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    Join(arg0, arg1, arg2) {
      return window.ctx.call("Colyseus.ColyseusClient", "Join", [this.ptr, arg0, arg1, arg2]);
    }
    Join_roomName_options_headers(roomName, options, headers) {
      return window.ctx.call("Colyseus.ColyseusClient", "Join_13163", [this.ptr, roomName, options, headers]);
    }
    JoinById(arg0, arg1, arg2) {
      return window.ctx.call("Colyseus.ColyseusClient", "JoinById", [this.ptr, arg0, arg1, arg2]);
    }
    JoinById_roomId_options_headers(roomId, options, headers) {
      return window.ctx.call("Colyseus.ColyseusClient", "JoinById_13164", [this.ptr, roomId, options, headers]);
    }
    JoinOrCreate(arg0, arg1, arg2) {
      return window.ctx.call("Colyseus.ColyseusClient", "JoinOrCreate", [this.ptr, arg0, arg1, arg2]);
    }
    JoinOrCreate_roomName_options_headers(roomName, options, headers) {
      return window.ctx.call("Colyseus.ColyseusClient", "JoinOrCreate_13161", [this.ptr, roomName, options, headers]);
    }
    Reconnect(arg0, arg1) {
      return window.ctx.call("Colyseus.ColyseusClient", "Reconnect", [this.ptr, arg0, arg1]);
    }
    Reconnect_roomId_sessionId_headers(roomId, sessionId, headers) {
      return window.ctx.call("Colyseus.ColyseusClient", "Reconnect_13165", [this.ptr, roomId, sessionId, headers]);
    }
  }
  class JSONNode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get AsArray() {
      return new JSONArray(window.ctx.call("SimpleJSON.JSONNode", "get_AsArray", [this.ptr]));
    }
    get AsBool() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_AsBool", [this.ptr]).val() === 1;
    }
    set AsBool(value) {
      window.ctx.call("SimpleJSON.JSONNode", "set_AsBool", [this.ptr, value]);
    }
    get AsDouble() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_AsDouble", [this.ptr]).val();
    }
    set AsDouble(value) {
      window.ctx.call("SimpleJSON.JSONNode", "set_AsDouble", [this.ptr, value]);
    }
    get AsFloat() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_AsFloat", [this.ptr]).val();
    }
    set AsFloat(value) {
      window.ctx.call("SimpleJSON.JSONNode", "set_AsFloat", [this.ptr, value]);
    }
    get AsInt() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_AsInt", [this.ptr]).val();
    }
    set AsInt(value) {
      window.ctx.call("SimpleJSON.JSONNode", "set_AsInt", [this.ptr, value]);
    }
    get AsLong() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_AsLong", [this.ptr]).val();
    }
    set AsLong(value) {
      window.ctx.call("SimpleJSON.JSONNode", "set_AsLong", [this.ptr, value]);
    }
    get AsObject() {
      return new JSONObject(window.ctx.call("SimpleJSON.JSONNode", "get_AsObject", [this.ptr]));
    }
    get AsULong() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_AsULong", [this.ptr]).val();
    }
    set AsULong(value) {
      window.ctx.call("SimpleJSON.JSONNode", "set_AsULong", [this.ptr, value]);
    }
    get Children() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_Children", [this.ptr]);
    }
    get Count() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_Count", [this.ptr]).val();
    }
    get DeepChildren() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_DeepChildren", [this.ptr]);
    }
    static get EscapeBuilder() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_EscapeBuilder", []);
    }
    get Inline() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_Inline", [this.ptr]).val() === 1;
    }
    set Inline(value) {
      window.ctx.call("SimpleJSON.JSONNode", "set_Inline", [this.ptr, value]);
    }
    get IsArray() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_IsArray", [this.ptr]).val() === 1;
    }
    get IsBoolean() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_IsBoolean", [this.ptr]).val() === 1;
    }
    get IsNull() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_IsNull", [this.ptr]).val() === 1;
    }
    get IsNumber() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_IsNumber", [this.ptr]).val() === 1;
    }
    get IsObject() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_IsObject", [this.ptr]).val() === 1;
    }
    get IsString() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_IsString", [this.ptr]).val() === 1;
    }
    get Item() {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONNode", "get_Item", [this.ptr, aKey]));
    }
    set Item(value) {
      window.ctx.call("SimpleJSON.JSONNode", "set_Item", [this.ptr, aKey, value]);
    }
    get Keys() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("SimpleJSON.JSONNode", "get_Keys", [out, this.ptr]);
        return out;
      })();
    }
    get Linq() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_Linq", [this.ptr]);
    }
    get Tag() {
      return new JSONNodeType(window.ctx.call("SimpleJSON.JSONNode", "get_Tag", [this.ptr]));
    }
    get Value() {
      return window.ctx.call("SimpleJSON.JSONNode", "get_Value", [this.ptr]);
    }
    set Value(value) {
      window.ctx.call("SimpleJSON.JSONNode", "set_Value", [this.ptr, value]);
    }
    get Values() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("SimpleJSON.JSONNode", "get_Values", [out, this.ptr]);
        return out;
      })();
    }
    get allowLineComments() {
      return this.ptr.readField(2, "i32").val() === 1;
    }
    set allowLineComments(value) {
      return this.ptr.writeField(2, "i32", value);
    }
    get forceASCII() {
      return this.ptr.readField(0, "i32").val() === 1;
    }
    set forceASCII(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get longAsString() {
      return this.ptr.readField(1, "i32").val() === 1;
    }
    set longAsString(value) {
      return this.ptr.writeField(1, "i32", value);
    }
    get m_EscapeBuilder() {
      return this.ptr.readField(0, "i32");
    }
    set m_EscapeBuilder(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    Add_aKey_aItem(aKeyValue, aItem) {
      window.ctx.call("SimpleJSON.JSONNode", "Add_10372", [this.ptr, aKeyValue, aItem]);
    }
    Add_aItem(aItem) {
      window.ctx.call("SimpleJSON.JSONNode", "Add_10373", [this.ptr, aItem]);
    }
    Clear() {
      window.ctx.call("SimpleJSON.JSONNode", "Clear", [this.ptr]);
    }
    Clone() {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONNode", "Clone", [this.ptr]));
    }
    Equals(arg0) {
      return window.ctx.call("SimpleJSON.JSONNode", "Equals", [this.ptr, arg0]).val() === 1;
    }
    static Escape(arg0) {
      return window.ctx.call("SimpleJSON.JSONNode", "Escape", [arg0]);
    }
    GetEnumerator() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("SimpleJSON.JSONNode", "GetEnumerator", [out, this.ptr]);
        return out;
      })();
    }
    GetHashCode() {
      return window.ctx.call("SimpleJSON.JSONNode", "GetHashCode", [this.ptr]).val();
    }
    GetValueOrDefault(arg0, arg1) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONNode", "GetValueOrDefault", [this.ptr, arg0, arg1]));
    }
    HasKey(arg0) {
      return window.ctx.call("SimpleJSON.JSONNode", "HasKey", [this.ptr, arg0]).val() === 1;
    }
    static Parse(arg0) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONNode", "Parse", [arg0]));
    }
    static ParseElement(arg0, arg1) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONNode", "ParseElement", [arg0, arg1]));
    }
    Remove_aKey(aKeyValue) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONNode", "Remove_10374", [this.ptr, aKeyValue]));
    }
    Remove_aIndex(aIndexValue) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONNode", "Remove_10375", [this.ptr, aIndexValue]));
    }
    Remove_aNode(aNode) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONNode", "Remove_10376", [this.ptr, aNode]));
    }
    ToString_pointer() {
      return window.ctx.call("SimpleJSON.JSONNode", "ToString_10383", [this.ptr]);
    }
    ToString_aIndent(aIndent) {
      return window.ctx.call("SimpleJSON.JSONNode", "ToString_10384", [this.ptr, aIndent]);
    }
    WriteToStringBuilder(arg0, arg1, arg2, arg3) {
      window.ctx.call("SimpleJSON.JSONNode", "WriteToStringBuilder", [this.ptr, arg0, arg1, arg2, arg3]);
    }
  }
  class Matchmake3DBoxState {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get index() {
      return this.ptr.readField(16, "i32");
    }
    set index(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get team0() {
      return this.ptr.readField(20, "i32").mstr();
    }
    set team0(value) {
      return this.ptr.writeField(20, "i32", window.ctx.createMstr(value));
    }
    get team1() {
      return this.ptr.readField(24, "i32").mstr();
    }
    set team1(value) {
      return this.ptr.writeField(24, "i32", window.ctx.createMstr(value));
    }
  }
  class RenderTexture {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    static get active() {
      return new RenderTexture(window.ctx.call("UnityEngine.RenderTexture", "get_active", []));
    }
    static set active(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_active", [value]);
    }
    get antiAliasing() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_antiAliasing", [this.ptr]).val();
    }
    set antiAliasing(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_antiAliasing", [this.ptr, value]);
    }
    get autoGenerateMips() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_autoGenerateMips", [this.ptr]).val() === 1;
    }
    set autoGenerateMips(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_autoGenerateMips", [this.ptr, value]);
    }
    get bindTextureMS() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_bindTextureMS", [this.ptr]).val() === 1;
    }
    set bindTextureMS(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_bindTextureMS", [this.ptr, value]);
    }
    get colorBuffer() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RenderTexture", "get_colorBuffer", [out, this.ptr]);
        return out;
      })();
    }
    get depth() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_depth", [this.ptr]).val();
    }
    set depth(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_depth", [this.ptr, value]);
    }
    get depthBuffer() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RenderTexture", "get_depthBuffer", [out, this.ptr]);
        return out;
      })();
    }
    get depthStencilFormat() {
      return new GraphicsFormat(window.ctx.call("UnityEngine.RenderTexture", "get_depthStencilFormat", [this.ptr]));
    }
    set depthStencilFormat(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_depthStencilFormat", [this.ptr, value]);
    }
    get descriptor() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RenderTexture", "get_descriptor", [out, this.ptr]);
        return out;
      })();
    }
    set descriptor(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_descriptor", [this.ptr, value]);
    }
    get dimension() {
      return new TextureDimension(window.ctx.call("UnityEngine.RenderTexture", "get_dimension", [this.ptr]));
    }
    set dimension(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_dimension", [this.ptr, value]);
    }
    static get enabled() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_enabled", []).val() === 1;
    }
    static set enabled(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_enabled", [value]);
    }
    get enableRandomWrite() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_enableRandomWrite", [this.ptr]).val() === 1;
    }
    set enableRandomWrite(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_enableRandomWrite", [this.ptr, value]);
    }
    get enableShadingRate() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_enableShadingRate", [this.ptr]).val() === 1;
    }
    set enableShadingRate(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_enableShadingRate", [this.ptr, value]);
    }
    get format() {
      return new RenderTextureFormat(window.ctx.call("UnityEngine.RenderTexture", "get_format", [this.ptr]));
    }
    set format(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_format", [this.ptr, value]);
    }
    get graphicsFormat() {
      return new GraphicsFormat(window.ctx.call("UnityEngine.RenderTexture", "get_graphicsFormat", [this.ptr]));
    }
    set graphicsFormat(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_graphicsFormat", [this.ptr, value]);
    }
    get height() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_height", [this.ptr]).val();
    }
    set height(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_height", [this.ptr, value]);
    }
    get isCubemap() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_isCubemap", [this.ptr]).val() === 1;
    }
    set isCubemap(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_isCubemap", [this.ptr, value]);
    }
    get isPowerOfTwo() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_isPowerOfTwo", [this.ptr]).val() === 1;
    }
    set isPowerOfTwo(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_isPowerOfTwo", [this.ptr, value]);
    }
    get isVolume() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_isVolume", [this.ptr]).val() === 1;
    }
    set isVolume(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_isVolume", [this.ptr, value]);
    }
    get memorylessMode() {
      return new RenderTextureMemoryless(
        window.ctx.call("UnityEngine.RenderTexture", "get_memorylessMode", [this.ptr]),
      );
    }
    set memorylessMode(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_memorylessMode", [this.ptr, value]);
    }
    get sRGB() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_sRGB", [this.ptr]).val() === 1;
    }
    get stencilFormat() {
      return new GraphicsFormat(window.ctx.call("UnityEngine.RenderTexture", "get_stencilFormat", [this.ptr]));
    }
    set stencilFormat(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_stencilFormat", [this.ptr, value]);
    }
    get useDynamicScale() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_useDynamicScale", [this.ptr]).val() === 1;
    }
    set useDynamicScale(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_useDynamicScale", [this.ptr, value]);
    }
    get useDynamicScaleExplicit() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_useDynamicScaleExplicit", [this.ptr]).val() === 1;
    }
    set useDynamicScaleExplicit(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_useDynamicScaleExplicit", [this.ptr, value]);
    }
    get useMipMap() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_useMipMap", [this.ptr]).val() === 1;
    }
    set useMipMap(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_useMipMap", [this.ptr, value]);
    }
    get volumeDepth() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_volumeDepth", [this.ptr]).val();
    }
    set volumeDepth(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_volumeDepth", [this.ptr, value]);
    }
    get vrUsage() {
      return new VRTextureUsage(window.ctx.call("UnityEngine.RenderTexture", "get_vrUsage", [this.ptr]));
    }
    set vrUsage(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_vrUsage", [this.ptr, value]);
    }
    get width() {
      return window.ctx.call("UnityEngine.RenderTexture", "get_width", [this.ptr]).val();
    }
    set width(value) {
      window.ctx.call("UnityEngine.RenderTexture", "set_width", [this.ptr, value]);
    }
    ApplyDynamicScale() {
      window.ctx.call("UnityEngine.RenderTexture", "ApplyDynamicScale", [this.ptr]);
    }
    static ApplyDynamicScale_Injected(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "ApplyDynamicScale_Injected", [arg0]);
    }
    ConvertToEquirect(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "ConvertToEquirect", [this.ptr, arg0, arg1]);
    }
    static ConvertToEquirect_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.RenderTexture", "ConvertToEquirect_Injected", [arg0, arg1, arg2]);
    }
    Create() {
      return window.ctx.call("UnityEngine.RenderTexture", "Create", [this.ptr]).val() === 1;
    }
    static Create_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "Create_Injected", [arg0]).val() === 1;
    }
    DiscardContents_discardColor_discardDepth(discardColor, discardDepth) {
      window.ctx.call("UnityEngine.RenderTexture", "DiscardContents_22942", [this.ptr, discardColor, discardDepth]);
    }
    DiscardContents_pointer() {
      window.ctx.call("UnityEngine.RenderTexture", "DiscardContents_22944", [this.ptr]);
    }
    static DiscardContents_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.RenderTexture", "DiscardContents_Injected", [arg0, arg1, arg2]);
    }
    GenerateMips() {
      window.ctx.call("UnityEngine.RenderTexture", "GenerateMips", [this.ptr]);
    }
    static GenerateMips_Injected(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "GenerateMips_Injected", [arg0]);
    }
    static GetActive() {
      return new RenderTexture(window.ctx.call("UnityEngine.RenderTexture", "GetActive", []));
    }
    static GetActive_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RenderTexture", "GetActive_Injected", [out]);
        return out;
      })();
    }
    GetColorBuffer() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RenderTexture", "GetColorBuffer", [out, this.ptr]);
        return out;
      })();
    }
    static GetColorBuffer_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "GetColorBuffer_Injected", [arg0, arg1]);
    }
    GetColorFormat(arg0) {
      return new GraphicsFormat(window.ctx.call("UnityEngine.RenderTexture", "GetColorFormat", [this.ptr, arg0]));
    }
    static GetColorFormat_Injected(arg0, arg1) {
      return new GraphicsFormat(window.ctx.call("UnityEngine.RenderTexture", "GetColorFormat_Injected", [arg0, arg1]));
    }
    static GetCompatibleFormat(arg0, arg1) {
      return new GraphicsFormat(window.ctx.call("UnityEngine.RenderTexture", "GetCompatibleFormat", [arg0, arg1]));
    }
    static GetDefaultColorFormat(arg0) {
      return new GraphicsFormat(window.ctx.call("UnityEngine.RenderTexture", "GetDefaultColorFormat", [arg0]));
    }
    static GetDefaultDepthStencilFormat(arg0, arg1) {
      return new GraphicsFormat(
        window.ctx.call("UnityEngine.RenderTexture", "GetDefaultDepthStencilFormat", [arg0, arg1]),
      );
    }
    GetDepthBuffer() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RenderTexture", "GetDepthBuffer", [out, this.ptr]);
        return out;
      })();
    }
    static GetDepthBuffer_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "GetDepthBuffer_Injected", [arg0, arg1]);
    }
    static GetDepthStencilFormatLegacy_depthBits_colorFormat(depthBits, colorFormat) {
      return new GraphicsFormat(
        window.ctx.call("UnityEngine.RenderTexture", "GetDepthStencilFormatLegacy_22977", [depthBits, colorFormat]),
      );
    }
    static GetDepthStencilFormatLegacy_depthBits_format_disableFallback(depthBits, format, disableFallback) {
      return new GraphicsFormat(
        window.ctx.call("UnityEngine.RenderTexture", "GetDepthStencilFormatLegacy_22978", [
          depthBits,
          format,
          disableFallback,
        ]),
      );
    }
    static GetDepthStencilFormatLegacy_depthBits_format(depthBits, format) {
      return new GraphicsFormat(
        window.ctx.call("UnityEngine.RenderTexture", "GetDepthStencilFormatLegacy_22979", [depthBits, format]),
      );
    }
    static GetDepthStencilFormatLegacy_depthBits_shadowSamplingMode(depthBits, shadowSamplingMode) {
      return new GraphicsFormat(
        window.ctx.call("UnityEngine.RenderTexture", "GetDepthStencilFormatLegacy_22980", [
          depthBits,
          shadowSamplingMode,
        ]),
      );
    }
    static GetDepthStencilFormatLegacy_depthBits_requestedShadowMap(depthBits, requestedShadowMap) {
      return new GraphicsFormat(
        window.ctx.call("UnityEngine.RenderTexture", "GetDepthStencilFormatLegacy_22981", [
          depthBits,
          requestedShadowMap,
        ]),
      );
    }
    GetDescriptor() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RenderTexture", "GetDescriptor", [out, this.ptr]);
        return out;
      })();
    }
    static GetDescriptor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "GetDescriptor_Injected", [arg0, arg1]);
    }
    GetIsPowerOfTwo() {
      return window.ctx.call("UnityEngine.RenderTexture", "GetIsPowerOfTwo", [this.ptr]).val() === 1;
    }
    static GetIsPowerOfTwo_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "GetIsPowerOfTwo_Injected", [arg0]).val() === 1;
    }
    GetNativeDepthBufferPtr() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RenderTexture", "GetNativeDepthBufferPtr", [out, this.ptr]);
        return out;
      })();
    }
    static GetNativeDepthBufferPtr_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RenderTexture", "GetNativeDepthBufferPtr_Injected", [out, arg0]);
        return out;
      })();
    }
    static GetShadowSamplingModeForFormat_format(format) {
      return new ShadowSamplingMode(
        window.ctx.call("UnityEngine.RenderTexture", "GetShadowSamplingModeForFormat_22987", [format]),
      );
    }
    static GetShadowSamplingModeForFormat_format(format) {
      return new ShadowSamplingMode(
        window.ctx.call("UnityEngine.RenderTexture", "GetShadowSamplingModeForFormat_22988", [format]),
      );
    }
    static GetTemporary_desc(desc) {
      return new RenderTexture(window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_22991", [desc]));
    }
    static GetTemporary_width_height_depthBuffer_format_antiAliasing_memorylessMode_vrUsage_useDynamicScale(
      width,
      height,
      depthBuffer,
      format,
      antiAliasing,
      memorylessMode,
      vrUsage,
      useDynamicScale,
    ) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_22993", [
          width,
          height,
          depthBuffer,
          format,
          antiAliasing,
          memorylessMode,
          vrUsage,
          useDynamicScale,
        ]),
      );
    }
    static GetTemporary_width_height_depthBuffer_format_antiAliasing_memorylessMode_vrUsage(
      width,
      height,
      depthBuffer,
      format,
      antiAliasing,
      memorylessMode,
      vrUsage,
    ) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_22994", [
          width,
          height,
          depthBuffer,
          format,
          antiAliasing,
          memorylessMode,
          vrUsage,
        ]),
      );
    }
    static GetTemporary_width_height_depthBuffer_format_antiAliasing_memorylessMode(
      width,
      height,
      depthBuffer,
      format,
      antiAliasing,
      memorylessMode,
    ) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_22995", [
          width,
          height,
          depthBuffer,
          format,
          antiAliasing,
          memorylessMode,
        ]),
      );
    }
    static GetTemporary_width_height_depthBuffer_format_antiAliasing(width, height, depthBuffer, format, antiAliasing) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_22996", [
          width,
          height,
          depthBuffer,
          format,
          antiAliasing,
        ]),
      );
    }
    static GetTemporary_width_height_depthBuffer_format(width, height, depthBuffer, format) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_22997", [width, height, depthBuffer, format]),
      );
    }
    static GetTemporary_width_height_depthBuffer_format_readWrite_antiAliasing_memorylessMode_vrUsage_useDynamicScale(
      width,
      height,
      depthBuffer,
      format,
      readWrite,
      antiAliasing,
      memorylessMode,
      vrUsage,
      useDynamicScale,
    ) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_22998", [
          width,
          height,
          depthBuffer,
          format,
          readWrite,
          antiAliasing,
          memorylessMode,
          vrUsage,
          useDynamicScale,
        ]),
      );
    }
    static GetTemporary_width_height_depthBuffer_format_readWrite_antiAliasing_memorylessMode_vrUsage(
      width,
      height,
      depthBuffer,
      format,
      readWrite,
      antiAliasing,
      memorylessMode,
      vrUsage,
    ) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_22999", [
          width,
          height,
          depthBuffer,
          format,
          readWrite,
          antiAliasing,
          memorylessMode,
          vrUsage,
        ]),
      );
    }
    static GetTemporary_width_height_depthBuffer_format_readWrite_antiAliasing_memorylessMode(
      width,
      height,
      depthBuffer,
      format,
      readWrite,
      antiAliasing,
      memorylessMode,
    ) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_23000", [
          width,
          height,
          depthBuffer,
          format,
          readWrite,
          antiAliasing,
          memorylessMode,
        ]),
      );
    }
    static GetTemporary_width_height_depthBuffer_format_readWrite_antiAliasing(
      width,
      height,
      depthBuffer,
      format,
      readWrite,
      antiAliasing,
    ) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_23001", [
          width,
          height,
          depthBuffer,
          format,
          readWrite,
          antiAliasing,
        ]),
      );
    }
    static GetTemporary_width_height_depthBuffer_format_readWrite(width, height, depthBuffer, format, readWrite) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_23002", [
          width,
          height,
          depthBuffer,
          format,
          readWrite,
        ]),
      );
    }
    static GetTemporary_width_height_depthBuffer_format(width, height, depthBuffer, format) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_23003", [width, height, depthBuffer, format]),
      );
    }
    static GetTemporary_width_height_depthBuffer(width, height, depthBuffer) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_23004", [width, height, depthBuffer]),
      );
    }
    static GetTemporary_width_height(width, height) {
      return new RenderTexture(window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_23005", [width, height]));
    }
    static GetTemporaryImpl(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
      return new RenderTexture(
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporaryImpl", [
          arg0,
          arg1,
          arg2,
          arg3,
          arg4,
          arg5,
          arg6,
          arg7,
          arg8,
        ]),
      );
    }
    static GetTemporary_Internal(arg0) {
      return new RenderTexture(window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_Internal", [arg0]));
    }
    static GetTemporary_Internal_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RenderTexture", "GetTemporary_Internal_Injected", [out, arg0]);
        return out;
      })();
    }
    GetTexelOffset() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.RenderTexture", "GetTexelOffset", [out, this.ptr]);
        return out;
      })();
    }
    Initialize(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.RenderTexture", "Initialize", [this.ptr, arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    static Internal_Create(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "Internal_Create", [arg0]);
    }
    IsCreated() {
      return window.ctx.call("UnityEngine.RenderTexture", "IsCreated", [this.ptr]).val() === 1;
    }
    static IsCreated_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "IsCreated_Injected", [arg0]).val() === 1;
    }
    MarkRestoreExpected() {
      window.ctx.call("UnityEngine.RenderTexture", "MarkRestoreExpected", [this.ptr]);
    }
    static MarkRestoreExpected_Injected(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "MarkRestoreExpected_Injected", [arg0]);
    }
    Release() {
      window.ctx.call("UnityEngine.RenderTexture", "Release", [this.ptr]);
    }
    static ReleaseTemporary(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "ReleaseTemporary", [arg0]);
    }
    static ReleaseTemporary_Injected(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "ReleaseTemporary_Injected", [arg0]);
    }
    static Release_Injected(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "Release_Injected", [arg0]);
    }
    ResolveAA() {
      window.ctx.call("UnityEngine.RenderTexture", "ResolveAA", [this.ptr]);
    }
    ResolveAATo(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "ResolveAATo", [this.ptr, arg0]);
    }
    static ResolveAATo_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "ResolveAATo_Injected", [arg0, arg1]);
    }
    static ResolveAA_Injected(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "ResolveAA_Injected", [arg0]);
    }
    ResolveAntiAliasedSurface_pointer() {
      window.ctx.call("UnityEngine.RenderTexture", "ResolveAntiAliasedSurface_22947", [this.ptr]);
    }
    ResolveAntiAliasedSurface_target(target) {
      window.ctx.call("UnityEngine.RenderTexture", "ResolveAntiAliasedSurface_22948", [this.ptr, target]);
    }
    static SetActive(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "SetActive", [arg0]);
    }
    static SetActive_Injected(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "SetActive_Injected", [arg0]);
    }
    SetColorFormat(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "SetColorFormat", [this.ptr, arg0]);
    }
    static SetColorFormat_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "SetColorFormat_Injected", [arg0, arg1]);
    }
    SetGlobalShaderProperty(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "SetGlobalShaderProperty", [this.ptr, arg0]);
    }
    static SetGlobalShaderProperty_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "SetGlobalShaderProperty_Injected", [arg0, arg1]);
    }
    SetMipMapCount(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "SetMipMapCount", [this.ptr, arg0]);
    }
    static SetMipMapCount_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "SetMipMapCount_Injected", [arg0, arg1]);
    }
    SetRenderTextureDescriptor(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "SetRenderTextureDescriptor", [this.ptr, arg0]);
    }
    static SetRenderTextureDescriptor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "SetRenderTextureDescriptor_Injected", [arg0, arg1]);
    }
    SetSRGBReadWrite(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "SetSRGBReadWrite", [this.ptr, arg0]);
    }
    static SetSRGBReadWrite_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "SetSRGBReadWrite_Injected", [arg0, arg1]);
    }
    SetShadowSamplingMode(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "SetShadowSamplingMode", [this.ptr, arg0]);
    }
    static SetShadowSamplingMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "SetShadowSamplingMode_Injected", [arg0, arg1]);
    }
    static SupportsStencil(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "SupportsStencil", [arg0]).val() === 1;
    }
    static SupportsStencil_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "SupportsStencil_Injected", [arg0]).val() === 1;
    }
    static ValidateRenderTextureDesc(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "ValidateRenderTextureDesc", [arg0]);
    }
    static WarnAboutFallbackTo16BitsDepth(arg0) {
      window.ctx.call("UnityEngine.RenderTexture", "WarnAboutFallbackTo16BitsDepth", [arg0]);
    }
    static get_antiAliasing_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_antiAliasing_Injected", [arg0]).val();
    }
    static get_autoGenerateMips_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_autoGenerateMips_Injected", [arg0]).val() === 1;
    }
    static get_bindTextureMS_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_bindTextureMS_Injected", [arg0]).val() === 1;
    }
    static get_depthStencilFormat_Injected(arg0) {
      return new GraphicsFormat(
        window.ctx.call("UnityEngine.RenderTexture", "get_depthStencilFormat_Injected", [arg0]),
      );
    }
    static get_depth_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_depth_Injected", [arg0]).val();
    }
    static get_dimension_Injected(arg0) {
      return new TextureDimension(window.ctx.call("UnityEngine.RenderTexture", "get_dimension_Injected", [arg0]));
    }
    static get_enableRandomWrite_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_enableRandomWrite_Injected", [arg0]).val() === 1;
    }
    static get_enableShadingRate_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_enableShadingRate_Injected", [arg0]).val() === 1;
    }
    static get_height_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_height_Injected", [arg0]).val();
    }
    static get_memorylessMode_Injected(arg0) {
      return new RenderTextureMemoryless(
        window.ctx.call("UnityEngine.RenderTexture", "get_memorylessMode_Injected", [arg0]),
      );
    }
    static get_sRGB_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_sRGB_Injected", [arg0]).val() === 1;
    }
    static get_stencilFormat_Injected(arg0) {
      return new GraphicsFormat(window.ctx.call("UnityEngine.RenderTexture", "get_stencilFormat_Injected", [arg0]));
    }
    static get_useDynamicScaleExplicit_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_useDynamicScaleExplicit_Injected", [arg0]).val() === 1;
    }
    static get_useDynamicScale_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_useDynamicScale_Injected", [arg0]).val() === 1;
    }
    static get_useMipMap_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_useMipMap_Injected", [arg0]).val() === 1;
    }
    static get_volumeDepth_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_volumeDepth_Injected", [arg0]).val();
    }
    static get_vrUsage_Injected(arg0) {
      return new VRTextureUsage(window.ctx.call("UnityEngine.RenderTexture", "get_vrUsage_Injected", [arg0]));
    }
    static get_width_Injected(arg0) {
      return window.ctx.call("UnityEngine.RenderTexture", "get_width_Injected", [arg0]).val();
    }
    static set_antiAliasing_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_antiAliasing_Injected", [arg0, arg1]);
    }
    static set_autoGenerateMips_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_autoGenerateMips_Injected", [arg0, arg1]);
    }
    static set_bindTextureMS_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_bindTextureMS_Injected", [arg0, arg1]);
    }
    static set_depthStencilFormat_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_depthStencilFormat_Injected", [arg0, arg1]);
    }
    static set_depth_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_depth_Injected", [arg0, arg1]);
    }
    static set_dimension_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_dimension_Injected", [arg0, arg1]);
    }
    static set_enableRandomWrite_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_enableRandomWrite_Injected", [arg0, arg1]);
    }
    static set_enableShadingRate_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_enableShadingRate_Injected", [arg0, arg1]);
    }
    static set_height_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_height_Injected", [arg0, arg1]);
    }
    static set_memorylessMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_memorylessMode_Injected", [arg0, arg1]);
    }
    static set_stencilFormat_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_stencilFormat_Injected", [arg0, arg1]);
    }
    static set_useDynamicScaleExplicit_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_useDynamicScaleExplicit_Injected", [arg0, arg1]);
    }
    static set_useDynamicScale_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_useDynamicScale_Injected", [arg0, arg1]);
    }
    static set_useMipMap_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_useMipMap_Injected", [arg0, arg1]);
    }
    static set_volumeDepth_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_volumeDepth_Injected", [arg0, arg1]);
    }
    static set_vrUsage_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_vrUsage_Injected", [arg0, arg1]);
    }
    static set_width_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RenderTexture", "set_width_Injected", [arg0, arg1]);
    }
  }
  class RenderingPath {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class CameraType {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class CameraClearFlags {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class DepthTextureMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class OpaqueSortMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class Material {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get color() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Material", "get_color", [out, this.ptr]);
        return out;
      })();
    }
    set color(value) {
      window.ctx.call("UnityEngine.Material", "set_color", [this.ptr, value]);
    }
    get doubleSidedGI() {
      return window.ctx.call("UnityEngine.Material", "get_doubleSidedGI", [this.ptr]).val() === 1;
    }
    set doubleSidedGI(value) {
      window.ctx.call("UnityEngine.Material", "set_doubleSidedGI", [this.ptr, value]);
    }
    get enabledKeywords() {
      return window.ctx.call("UnityEngine.Material", "get_enabledKeywords", [this.ptr]);
    }
    set enabledKeywords(value) {
      window.ctx.call("UnityEngine.Material", "set_enabledKeywords", [this.ptr, value]);
    }
    get enableInstancing() {
      return window.ctx.call("UnityEngine.Material", "get_enableInstancing", [this.ptr]).val() === 1;
    }
    set enableInstancing(value) {
      window.ctx.call("UnityEngine.Material", "set_enableInstancing", [this.ptr, value]);
    }
    get globalIlluminationFlags() {
      return new MaterialGlobalIlluminationFlags(
        window.ctx.call("UnityEngine.Material", "get_globalIlluminationFlags", [this.ptr]),
      );
    }
    set globalIlluminationFlags(value) {
      window.ctx.call("UnityEngine.Material", "set_globalIlluminationFlags", [this.ptr, value]);
    }
    get mainTexture() {
      return new Texture(window.ctx.call("UnityEngine.Material", "get_mainTexture", [this.ptr]));
    }
    set mainTexture(value) {
      window.ctx.call("UnityEngine.Material", "set_mainTexture", [this.ptr, value]);
    }
    get mainTextureOffset() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Material", "get_mainTextureOffset", [out, this.ptr]);
        return out;
      })();
    }
    set mainTextureOffset(value) {
      window.ctx.call("UnityEngine.Material", "set_mainTextureOffset", [this.ptr, value]);
    }
    get mainTextureScale() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Material", "get_mainTextureScale", [out, this.ptr]);
        return out;
      })();
    }
    set mainTextureScale(value) {
      window.ctx.call("UnityEngine.Material", "set_mainTextureScale", [this.ptr, value]);
    }
    get passCount() {
      return window.ctx.call("UnityEngine.Material", "get_passCount", [this.ptr]).val();
    }
    get rawRenderQueue() {
      return window.ctx.call("UnityEngine.Material", "get_rawRenderQueue", [this.ptr]).val();
    }
    get renderQueue() {
      return window.ctx.call("UnityEngine.Material", "get_renderQueue", [this.ptr]).val();
    }
    set renderQueue(value) {
      window.ctx.call("UnityEngine.Material", "set_renderQueue", [this.ptr, value]);
    }
    get shader() {
      return new Shader(window.ctx.call("UnityEngine.Material", "get_shader", [this.ptr]));
    }
    set shader(value) {
      window.ctx.call("UnityEngine.Material", "set_shader", [this.ptr, value]);
    }
    get shaderKeywords() {
      return window.ctx.call("UnityEngine.Material", "get_shaderKeywords", [this.ptr]);
    }
    set shaderKeywords(value) {
      window.ctx.call("UnityEngine.Material", "set_shaderKeywords", [this.ptr, value]);
    }
    get k_ColorId() {
      return this.ptr.readField(0, "i32").val();
    }
    set k_ColorId(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get k_MainTexId() {
      return this.ptr.readField(4, "i32").val();
    }
    set k_MainTexId(value) {
      return this.ptr.writeField(4, "i32", value);
    }
    ComputeCRC() {
      return window.ctx.call("UnityEngine.Material", "ComputeCRC", [this.ptr]).val();
    }
    static ComputeCRC_Injected(arg0) {
      return window.ctx.call("UnityEngine.Material", "ComputeCRC_Injected", [arg0]).val();
    }
    CopyMatchingPropertiesFromMaterial(arg0) {
      window.ctx.call("UnityEngine.Material", "CopyMatchingPropertiesFromMaterial", [this.ptr, arg0]);
    }
    static CopyMatchingPropertiesFromMaterial_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "CopyMatchingPropertiesFromMaterial_Injected", [arg0, arg1]);
    }
    CopyPropertiesFromMaterial(arg0) {
      window.ctx.call("UnityEngine.Material", "CopyPropertiesFromMaterial", [this.ptr, arg0]);
    }
    static CopyPropertiesFromMaterial_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "CopyPropertiesFromMaterial_Injected", [arg0, arg1]);
    }
    static Create(arg0) {
      return new Material(window.ctx.call("UnityEngine.Material", "Create", [arg0]));
    }
    static CreateWithMaterial(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "CreateWithMaterial", [arg0, arg1]);
    }
    static CreateWithMaterial_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "CreateWithMaterial_Injected", [arg0, arg1]);
    }
    static CreateWithShader(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "CreateWithShader", [arg0, arg1]);
    }
    static CreateWithShader_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "CreateWithShader_Injected", [arg0, arg1]);
    }
    DisableKeyword_keyword(keyword) {
      window.ctx.call("UnityEngine.Material", "DisableKeyword_21573", [this.ptr, keyword]);
    }
    DisableKeyword_keyword(keyword) {
      window.ctx.call("UnityEngine.Material", "DisableKeyword_21580", [this.ptr, keyword]);
    }
    static DisableKeyword_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "DisableKeyword_Injected", [arg0, arg1]);
    }
    DisableLocalKeyword(arg0) {
      window.ctx.call("UnityEngine.Material", "DisableLocalKeyword", [this.ptr, arg0]);
    }
    static DisableLocalKeyword_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "DisableLocalKeyword_Injected", [arg0, arg1]);
    }
    EnableKeyword_keyword(keyword) {
      window.ctx.call("UnityEngine.Material", "EnableKeyword_2798", [this.ptr, keyword]);
    }
    EnableKeyword_keyword(keyword) {
      window.ctx.call("UnityEngine.Material", "EnableKeyword_21579", [this.ptr, keyword]);
    }
    static EnableKeyword_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "EnableKeyword_Injected", [arg0, arg1]);
    }
    EnableLocalKeyword(arg0) {
      window.ctx.call("UnityEngine.Material", "EnableLocalKeyword", [this.ptr, arg0]);
    }
    static EnableLocalKeyword_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "EnableLocalKeyword_Injected", [arg0, arg1]);
    }
    ExtractColorArray(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "ExtractColorArray", [this.ptr, arg0, arg1]);
    }
    ExtractColorArrayImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "ExtractColorArrayImpl", [this.ptr, arg0, arg1]);
    }
    static ExtractColorArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "ExtractColorArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    ExtractFloatArray(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "ExtractFloatArray", [this.ptr, arg0, arg1]);
    }
    ExtractFloatArrayImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "ExtractFloatArrayImpl", [this.ptr, arg0, arg1]);
    }
    static ExtractFloatArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "ExtractFloatArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    ExtractMatrixArray(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "ExtractMatrixArray", [this.ptr, arg0, arg1]);
    }
    ExtractMatrixArrayImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "ExtractMatrixArrayImpl", [this.ptr, arg0, arg1]);
    }
    static ExtractMatrixArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "ExtractMatrixArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    ExtractVectorArray(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "ExtractVectorArray", [this.ptr, arg0, arg1]);
    }
    ExtractVectorArrayImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "ExtractVectorArrayImpl", [this.ptr, arg0, arg1]);
    }
    static ExtractVectorArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "ExtractVectorArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    FindPass(arg0) {
      return window.ctx.call("UnityEngine.Material", "FindPass", [this.ptr, arg0]).val();
    }
    static FindPass_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "FindPass_Injected", [arg0, arg1]).val();
    }
    GetBuffer(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Material", "GetBuffer", [out, this.ptr, arg0]);
        return out;
      })();
    }
    GetBufferImpl(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Material", "GetBufferImpl", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetBufferImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "GetBufferImpl_Injected", [arg0, arg1, arg2]);
    }
    GetColor_name(name) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Material", "GetColor_21709", [out, this.ptr, name]);
        return out;
      })();
    }
    GetColor_nameID(nameID) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Material", "GetColor_21710", [out, this.ptr, nameID]);
        return out;
      })();
    }
    GetColorArray_name(name) {
      return window.ctx.call("UnityEngine.Material", "GetColorArray_21721", [this.ptr, name]);
    }
    GetColorArray_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "GetColorArray_21722", [this.ptr, nameID]);
    }
    GetColorArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "GetColorArray_21729", [this.ptr, name, values]);
    }
    GetColorArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "GetColorArray_21730", [this.ptr, nameID, values]);
    }
    GetColorArrayCountImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetColorArrayCountImpl", [this.ptr, arg0]).val();
    }
    static GetColorArrayCountImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "GetColorArrayCountImpl_Injected", [arg0, arg1]).val();
    }
    GetColorArrayImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetColorArrayImpl", [this.ptr, arg0]);
    }
    static GetColorArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "GetColorArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    GetColorImpl(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Material", "GetColorImpl", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetColorImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "GetColorImpl_Injected", [arg0, arg1, arg2]);
    }
    GetConstantBuffer(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Material", "GetConstantBuffer", [out, this.ptr, arg0]);
        return out;
      })();
    }
    GetConstantBufferImpl(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Material", "GetConstantBufferImpl", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetConstantBufferImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "GetConstantBufferImpl_Injected", [arg0, arg1, arg2]);
    }
    static GetDefaultLineMaterial() {
      return new Material(window.ctx.call("UnityEngine.Material", "GetDefaultLineMaterial", []));
    }
    static GetDefaultLineMaterial_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Material", "GetDefaultLineMaterial_Injected", [out]);
        return out;
      })();
    }
    static GetDefaultMaterial() {
      return new Material(window.ctx.call("UnityEngine.Material", "GetDefaultMaterial", []));
    }
    static GetDefaultMaterial_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Material", "GetDefaultMaterial_Injected", [out]);
        return out;
      })();
    }
    static GetDefaultParticleMaterial() {
      return new Material(window.ctx.call("UnityEngine.Material", "GetDefaultParticleMaterial", []));
    }
    static GetDefaultParticleMaterial_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Material", "GetDefaultParticleMaterial_Injected", [out]);
        return out;
      })();
    }
    GetEnabledKeywords() {
      return window.ctx.call("UnityEngine.Material", "GetEnabledKeywords", [this.ptr]);
    }
    static GetEnabledKeywords_Injected(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetEnabledKeywords_Injected", [arg0]);
    }
    GetFirstPropertyNameIdByAttribute(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetFirstPropertyNameIdByAttribute", [this.ptr, arg0]).val();
    }
    static GetFirstPropertyNameIdByAttribute_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "GetFirstPropertyNameIdByAttribute_Injected", [arg0, arg1]).val();
    }
    GetFloat_name(name) {
      return window.ctx.call("UnityEngine.Material", "GetFloat_21705", [this.ptr, name]).val();
    }
    GetFloat_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "GetFloat_21706", [this.ptr, nameID]).val();
    }
    GetFloatArray_name(name) {
      return window.ctx.call("UnityEngine.Material", "GetFloatArray_21719", [this.ptr, name]);
    }
    GetFloatArray_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "GetFloatArray_21720", [this.ptr, nameID]);
    }
    GetFloatArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "GetFloatArray_21727", [this.ptr, name, values]);
    }
    GetFloatArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "GetFloatArray_21728", [this.ptr, nameID, values]);
    }
    GetFloatArrayCountImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetFloatArrayCountImpl", [this.ptr, arg0]).val();
    }
    static GetFloatArrayCountImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "GetFloatArrayCountImpl_Injected", [arg0, arg1]).val();
    }
    GetFloatArrayImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetFloatArrayImpl", [this.ptr, arg0]);
    }
    static GetFloatArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "GetFloatArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    GetFloatImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetFloatImpl", [this.ptr, arg0]).val();
    }
    static GetFloatImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "GetFloatImpl_Injected", [arg0, arg1]).val();
    }
    GetInt_name(name) {
      return window.ctx.call("UnityEngine.Material", "GetInt_21703", [this.ptr, name]).val();
    }
    GetInt_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "GetInt_21704", [this.ptr, nameID]).val();
    }
    GetIntImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetIntImpl", [this.ptr, arg0]).val();
    }
    static GetIntImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "GetIntImpl_Injected", [arg0, arg1]).val();
    }
    GetInteger_name(name) {
      return window.ctx.call("UnityEngine.Material", "GetInteger_21707", [this.ptr, name]).val();
    }
    GetInteger_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "GetInteger_21708", [this.ptr, nameID]).val();
    }
    GetMatrix_name(name) {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Material", "GetMatrix_21713", [out, this.ptr, name]);
        return out;
      })();
    }
    GetMatrix_nameID(nameID) {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Material", "GetMatrix_21714", [out, this.ptr, nameID]);
        return out;
      })();
    }
    GetMatrixArray_name(name) {
      return window.ctx.call("UnityEngine.Material", "GetMatrixArray_21725", [this.ptr, name]);
    }
    GetMatrixArray_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "GetMatrixArray_21726", [this.ptr, nameID]);
    }
    GetMatrixArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "GetMatrixArray_21733", [this.ptr, name, values]);
    }
    GetMatrixArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "GetMatrixArray_21734", [this.ptr, nameID, values]);
    }
    GetMatrixArrayCountImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetMatrixArrayCountImpl", [this.ptr, arg0]).val();
    }
    static GetMatrixArrayCountImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "GetMatrixArrayCountImpl_Injected", [arg0, arg1]).val();
    }
    GetMatrixArrayImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetMatrixArrayImpl", [this.ptr, arg0]);
    }
    static GetMatrixArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "GetMatrixArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    GetMatrixImpl(arg0) {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Material", "GetMatrixImpl", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetMatrixImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "GetMatrixImpl_Injected", [arg0, arg1, arg2]);
    }
    GetPassName(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetPassName", [this.ptr, arg0]);
    }
    static GetPassName_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "GetPassName_Injected", [arg0, arg1, arg2]);
    }
    GetPropertyCount() {
      return window.ctx.call("UnityEngine.Material", "GetPropertyCount", [this.ptr]).val();
    }
    static GetPropertyCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetPropertyCount_Injected", [arg0]).val();
    }
    GetPropertyNames(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetPropertyNames", [this.ptr, arg0]);
    }
    GetPropertyNamesImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetPropertyNamesImpl", [this.ptr, arg0]);
    }
    static GetPropertyNamesImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "GetPropertyNamesImpl_Injected", [arg0, arg1]);
    }
    GetShaderKeywords() {
      return window.ctx.call("UnityEngine.Material", "GetShaderKeywords", [this.ptr]);
    }
    static GetShaderKeywords_Injected(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetShaderKeywords_Injected", [arg0]);
    }
    GetShaderPassEnabled(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetShaderPassEnabled", [this.ptr, arg0]).val() === 1;
    }
    static GetShaderPassEnabled_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "GetShaderPassEnabled_Injected", [arg0, arg1]).val() === 1;
    }
    GetTag_tag_searchFallbacks_defaultValue(tag, searchFallbacks, defaultValue) {
      return window.ctx.call("UnityEngine.Material", "GetTag_21600", [this.ptr, tag, searchFallbacks, defaultValue]);
    }
    GetTag_tag_searchFallbacks(tag, searchFallbacks) {
      return window.ctx.call("UnityEngine.Material", "GetTag_21601", [this.ptr, tag, searchFallbacks]);
    }
    GetTagImpl(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Material", "GetTagImpl", [this.ptr, arg0, arg1, arg2]);
    }
    static GetTagImpl_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Material", "GetTagImpl_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    GetTexture_name(name) {
      return new Texture(window.ctx.call("UnityEngine.Material", "GetTexture_21715", [this.ptr, name]));
    }
    GetTexture_nameID(nameID) {
      return new Texture(window.ctx.call("UnityEngine.Material", "GetTexture_21716", [this.ptr, nameID]));
    }
    GetTextureImpl(arg0) {
      return new Texture(window.ctx.call("UnityEngine.Material", "GetTextureImpl", [this.ptr, arg0]));
    }
    static GetTextureImpl_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Material", "GetTextureImpl_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    GetTextureOffset_name(name) {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Material", "GetTextureOffset_21739", [out, this.ptr, name]);
        return out;
      })();
    }
    GetTextureOffset_nameID(nameID) {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Material", "GetTextureOffset_21740", [out, this.ptr, nameID]);
        return out;
      })();
    }
    GetTexturePropertyNameIDs_pointer() {
      return window.ctx.call("UnityEngine.Material", "GetTexturePropertyNameIDs_21614", [this.ptr]);
    }
    GetTexturePropertyNameIDs_outNames(outNames) {
      window.ctx.call("UnityEngine.Material", "GetTexturePropertyNameIDs_21618", [this.ptr, outNames]);
    }
    GetTexturePropertyNameIDsInternal(arg0) {
      window.ctx.call("UnityEngine.Material", "GetTexturePropertyNameIDsInternal", [this.ptr, arg0]);
    }
    static GetTexturePropertyNameIDsInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "GetTexturePropertyNameIDsInternal_Injected", [arg0, arg1]);
    }
    static GetTexturePropertyNameIDs_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "GetTexturePropertyNameIDs_Injected", [arg0, arg1]);
    }
    GetTexturePropertyNames_pointer() {
      return window.ctx.call("UnityEngine.Material", "GetTexturePropertyNames_21613", [this.ptr]);
    }
    GetTexturePropertyNames_outNames(outNames) {
      window.ctx.call("UnityEngine.Material", "GetTexturePropertyNames_21617", [this.ptr, outNames]);
    }
    GetTexturePropertyNamesInternal(arg0) {
      window.ctx.call("UnityEngine.Material", "GetTexturePropertyNamesInternal", [this.ptr, arg0]);
    }
    static GetTexturePropertyNamesInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "GetTexturePropertyNamesInternal_Injected", [arg0, arg1]);
    }
    static GetTexturePropertyNames_Injected(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetTexturePropertyNames_Injected", [arg0]);
    }
    GetTextureScale_name(name) {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Material", "GetTextureScale_21741", [out, this.ptr, name]);
        return out;
      })();
    }
    GetTextureScale_nameID(nameID) {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Material", "GetTextureScale_21742", [out, this.ptr, nameID]);
        return out;
      })();
    }
    GetTextureScaleAndOffsetImpl(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Material", "GetTextureScaleAndOffsetImpl", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetTextureScaleAndOffsetImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "GetTextureScaleAndOffsetImpl_Injected", [arg0, arg1, arg2]);
    }
    GetVector_name(name) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Material", "GetVector_21711", [out, this.ptr, name]);
        return out;
      })();
    }
    GetVector_nameID(nameID) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Material", "GetVector_21712", [out, this.ptr, nameID]);
        return out;
      })();
    }
    GetVectorArray_name(name) {
      return window.ctx.call("UnityEngine.Material", "GetVectorArray_21723", [this.ptr, name]);
    }
    GetVectorArray_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "GetVectorArray_21724", [this.ptr, nameID]);
    }
    GetVectorArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "GetVectorArray_21731", [this.ptr, name, values]);
    }
    GetVectorArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "GetVectorArray_21732", [this.ptr, nameID, values]);
    }
    GetVectorArrayCountImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetVectorArrayCountImpl", [this.ptr, arg0]).val();
    }
    static GetVectorArrayCountImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "GetVectorArrayCountImpl_Injected", [arg0, arg1]).val();
    }
    GetVectorArrayImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "GetVectorArrayImpl", [this.ptr, arg0]);
    }
    static GetVectorArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "GetVectorArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    HasBuffer_name(name) {
      return window.ctx.call("UnityEngine.Material", "HasBuffer_21565", [this.ptr, name]).val() === 1;
    }
    HasBuffer_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "HasBuffer_21566", [this.ptr, nameID]).val() === 1;
    }
    HasBufferImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "HasBufferImpl", [this.ptr, arg0]).val() === 1;
    }
    static HasBufferImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "HasBufferImpl_Injected", [arg0, arg1]).val() === 1;
    }
    HasColor_name(name) {
      return window.ctx.call("UnityEngine.Material", "HasColor_21562", [this.ptr, name]).val() === 1;
    }
    HasColor_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "HasColor_21563", [this.ptr, nameID]).val() === 1;
    }
    HasConstantBuffer_name(name) {
      return window.ctx.call("UnityEngine.Material", "HasConstantBuffer_21568", [this.ptr, name]).val() === 1;
    }
    HasConstantBuffer_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "HasConstantBuffer_21569", [this.ptr, nameID]).val() === 1;
    }
    HasConstantBufferImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "HasConstantBufferImpl", [this.ptr, arg0]).val() === 1;
    }
    static HasConstantBufferImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "HasConstantBufferImpl_Injected", [arg0, arg1]).val() === 1;
    }
    HasFloat_name(name) {
      return window.ctx.call("UnityEngine.Material", "HasFloat_21546", [this.ptr, name]).val() === 1;
    }
    HasFloat_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "HasFloat_21547", [this.ptr, nameID]).val() === 1;
    }
    HasFloatImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "HasFloatImpl", [this.ptr, arg0]).val() === 1;
    }
    static HasFloatImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "HasFloatImpl_Injected", [arg0, arg1]).val() === 1;
    }
    HasInt_name(name) {
      return window.ctx.call("UnityEngine.Material", "HasInt_21548", [this.ptr, name]).val() === 1;
    }
    HasInt_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "HasInt_21549", [this.ptr, nameID]).val() === 1;
    }
    HasIntImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "HasIntImpl", [this.ptr, arg0]).val() === 1;
    }
    static HasIntImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "HasIntImpl_Injected", [arg0, arg1]).val() === 1;
    }
    HasInteger_name(name) {
      return window.ctx.call("UnityEngine.Material", "HasInteger_21551", [this.ptr, name]).val() === 1;
    }
    HasInteger_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "HasInteger_21552", [this.ptr, nameID]).val() === 1;
    }
    HasMatrix_name(name) {
      return window.ctx.call("UnityEngine.Material", "HasMatrix_21557", [this.ptr, name]).val() === 1;
    }
    HasMatrix_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "HasMatrix_21558", [this.ptr, nameID]).val() === 1;
    }
    HasMatrixImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "HasMatrixImpl", [this.ptr, arg0]).val() === 1;
    }
    static HasMatrixImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "HasMatrixImpl_Injected", [arg0, arg1]).val() === 1;
    }
    HasProperty_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "HasProperty_21543", [this.ptr, nameID]).val() === 1;
    }
    HasProperty_name(name) {
      return window.ctx.call("UnityEngine.Material", "HasProperty_21544", [this.ptr, name]).val() === 1;
    }
    static HasProperty_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "HasProperty_Injected", [arg0, arg1]).val() === 1;
    }
    HasTexture_name(name) {
      return window.ctx.call("UnityEngine.Material", "HasTexture_21554", [this.ptr, name]).val() === 1;
    }
    HasTexture_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "HasTexture_21555", [this.ptr, nameID]).val() === 1;
    }
    HasTextureImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "HasTextureImpl", [this.ptr, arg0]).val() === 1;
    }
    static HasTextureImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "HasTextureImpl_Injected", [arg0, arg1]).val() === 1;
    }
    HasVector_name(name) {
      return window.ctx.call("UnityEngine.Material", "HasVector_21560", [this.ptr, name]).val() === 1;
    }
    HasVector_nameID(nameID) {
      return window.ctx.call("UnityEngine.Material", "HasVector_21561", [this.ptr, nameID]).val() === 1;
    }
    HasVectorImpl(arg0) {
      return window.ctx.call("UnityEngine.Material", "HasVectorImpl", [this.ptr, arg0]).val() === 1;
    }
    static HasVectorImpl_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "HasVectorImpl_Injected", [arg0, arg1]).val() === 1;
    }
    IsKeywordEnabled_keyword(keyword) {
      return window.ctx.call("UnityEngine.Material", "IsKeywordEnabled_21574", [this.ptr, keyword]).val() === 1;
    }
    IsKeywordEnabled_keyword(keyword) {
      return window.ctx.call("UnityEngine.Material", "IsKeywordEnabled_21582", [this.ptr, keyword]).val() === 1;
    }
    static IsKeywordEnabled_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "IsKeywordEnabled_Injected", [arg0, arg1]).val() === 1;
    }
    IsLocalKeywordEnabled(arg0) {
      return window.ctx.call("UnityEngine.Material", "IsLocalKeywordEnabled", [this.ptr, arg0]).val() === 1;
    }
    static IsLocalKeywordEnabled_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "IsLocalKeywordEnabled_Injected", [arg0, arg1]).val() === 1;
    }
    Lerp(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "Lerp", [this.ptr, arg0, arg1, arg2]);
    }
    static Lerp_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Material", "Lerp_Injected", [arg0, arg1, arg2, arg3]);
    }
    SetBuffer_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetBuffer_21679", [this.ptr, name, value]);
    }
    SetBuffer_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetBuffer_21680", [this.ptr, nameID, value]);
    }
    SetBuffer_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetBuffer_21681", [this.ptr, name, value]);
    }
    SetBuffer_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetBuffer_21682", [this.ptr, nameID, value]);
    }
    SetBufferImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetBufferImpl", [this.ptr, arg0, arg1]);
    }
    static SetBufferImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetBufferImpl_Injected", [arg0, arg1, arg2]);
    }
    SetColor_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetColor_21669", [this.ptr, name, value]);
    }
    SetColor_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetColor_21670", [this.ptr, nameID, value]);
    }
    SetColorArray_name_values_count(name, values, count) {
      window.ctx.call("UnityEngine.Material", "SetColorArray_21657", [this.ptr, name, values, count]);
    }
    SetColorArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "SetColorArray_21691", [this.ptr, name, values]);
    }
    SetColorArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "SetColorArray_21692", [this.ptr, nameID, values]);
    }
    SetColorArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "SetColorArray_21693", [this.ptr, name, values]);
    }
    SetColorArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "SetColorArray_21694", [this.ptr, nameID, values]);
    }
    SetColorArrayImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetColorArrayImpl", [this.ptr, arg0, arg1, arg2]);
    }
    static SetColorArrayImpl_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Material", "SetColorArrayImpl_Injected", [arg0, arg1, arg2, arg3]);
    }
    SetColorImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetColorImpl", [this.ptr, arg0, arg1]);
    }
    static SetColorImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetColorImpl_Injected", [arg0, arg1, arg2]);
    }
    SetConstantBuffer_name_value_offset_size(name, value, offset, size) {
      window.ctx.call("UnityEngine.Material", "SetConstantBuffer_21683", [this.ptr, name, value, offset, size]);
    }
    SetConstantBuffer_nameID_value_offset_size(nameID, value, offset, size) {
      window.ctx.call("UnityEngine.Material", "SetConstantBuffer_21684", [this.ptr, nameID, value, offset, size]);
    }
    SetConstantBuffer_name_value_offset_size(name, value, offset, size) {
      window.ctx.call("UnityEngine.Material", "SetConstantBuffer_21685", [this.ptr, name, value, offset, size]);
    }
    SetConstantBuffer_nameID_value_offset_size(nameID, value, offset, size) {
      window.ctx.call("UnityEngine.Material", "SetConstantBuffer_21686", [this.ptr, nameID, value, offset, size]);
    }
    SetConstantBufferImpl(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Material", "SetConstantBufferImpl", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    static SetConstantBufferImpl_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Material", "SetConstantBufferImpl_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    SetConstantGraphicsBufferImpl(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Material", "SetConstantGraphicsBufferImpl", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    static SetConstantGraphicsBufferImpl_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Material", "SetConstantGraphicsBufferImpl_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    SetEnabledKeywords(arg0) {
      window.ctx.call("UnityEngine.Material", "SetEnabledKeywords", [this.ptr, arg0]);
    }
    static SetEnabledKeywords_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetEnabledKeywords_Injected", [arg0, arg1]);
    }
    SetFloat_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetFloat_21665", [this.ptr, name, value]);
    }
    SetFloat_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetFloat_21666", [this.ptr, nameID, value]);
    }
    SetFloatArray_name_values_count(name, values, count) {
      window.ctx.call("UnityEngine.Material", "SetFloatArray_21655", [this.ptr, name, values, count]);
    }
    SetFloatArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "SetFloatArray_21687", [this.ptr, name, values]);
    }
    SetFloatArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "SetFloatArray_21688", [this.ptr, nameID, values]);
    }
    SetFloatArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "SetFloatArray_21689", [this.ptr, name, values]);
    }
    SetFloatArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "SetFloatArray_21690", [this.ptr, nameID, values]);
    }
    SetFloatArrayImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetFloatArrayImpl", [this.ptr, arg0, arg1, arg2]);
    }
    static SetFloatArrayImpl_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Material", "SetFloatArrayImpl_Injected", [arg0, arg1, arg2, arg3]);
    }
    SetFloatImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetFloatImpl", [this.ptr, arg0, arg1]);
    }
    static SetFloatImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetFloatImpl_Injected", [arg0, arg1, arg2]);
    }
    SetGraphicsBufferImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetGraphicsBufferImpl", [this.ptr, arg0, arg1]);
    }
    static SetGraphicsBufferImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetGraphicsBufferImpl_Injected", [arg0, arg1, arg2]);
    }
    SetInt_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetInt_21663", [this.ptr, name, value]);
    }
    SetInt_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetInt_21664", [this.ptr, nameID, value]);
    }
    SetIntImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetIntImpl", [this.ptr, arg0, arg1]);
    }
    static SetIntImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetIntImpl_Injected", [arg0, arg1, arg2]);
    }
    SetInteger_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetInteger_21667", [this.ptr, name, value]);
    }
    SetInteger_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetInteger_21668", [this.ptr, nameID, value]);
    }
    SetKeyword(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetKeyword", [this.ptr, arg0, arg1]);
    }
    SetLocalKeyword(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetLocalKeyword", [this.ptr, arg0, arg1]);
    }
    static SetLocalKeyword_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetLocalKeyword_Injected", [arg0, arg1, arg2]);
    }
    SetMatrix_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetMatrix_21673", [this.ptr, name, value]);
    }
    SetMatrix_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetMatrix_21674", [this.ptr, nameID, value]);
    }
    SetMatrixArray_name_values_count(name, values, count) {
      window.ctx.call("UnityEngine.Material", "SetMatrixArray_21658", [this.ptr, name, values, count]);
    }
    SetMatrixArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "SetMatrixArray_21699", [this.ptr, name, values]);
    }
    SetMatrixArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "SetMatrixArray_21700", [this.ptr, nameID, values]);
    }
    SetMatrixArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "SetMatrixArray_21701", [this.ptr, name, values]);
    }
    SetMatrixArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "SetMatrixArray_21702", [this.ptr, nameID, values]);
    }
    SetMatrixArrayImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetMatrixArrayImpl", [this.ptr, arg0, arg1, arg2]);
    }
    static SetMatrixArrayImpl_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Material", "SetMatrixArrayImpl_Injected", [arg0, arg1, arg2, arg3]);
    }
    SetMatrixImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetMatrixImpl", [this.ptr, arg0, arg1]);
    }
    static SetMatrixImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetMatrixImpl_Injected", [arg0, arg1, arg2]);
    }
    SetOverrideTag(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetOverrideTag", [this.ptr, arg0, arg1]);
    }
    static SetOverrideTag_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetOverrideTag_Injected", [arg0, arg1, arg2]);
    }
    SetPass(arg0) {
      return window.ctx.call("UnityEngine.Material", "SetPass", [this.ptr, arg0]).val() === 1;
    }
    static SetPass_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Material", "SetPass_Injected", [arg0, arg1]).val() === 1;
    }
    SetRenderTextureImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetRenderTextureImpl", [this.ptr, arg0, arg1, arg2]);
    }
    static SetRenderTextureImpl_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Material", "SetRenderTextureImpl_Injected", [arg0, arg1, arg2, arg3]);
    }
    SetShaderKeywords(arg0) {
      window.ctx.call("UnityEngine.Material", "SetShaderKeywords", [this.ptr, arg0]);
    }
    static SetShaderKeywords_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetShaderKeywords_Injected", [arg0, arg1]);
    }
    SetShaderPassEnabled(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetShaderPassEnabled", [this.ptr, arg0, arg1]);
    }
    static SetShaderPassEnabled_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetShaderPassEnabled_Injected", [arg0, arg1, arg2]);
    }
    SetTexture_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetTexture_21675", [this.ptr, name, value]);
    }
    SetTexture_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetTexture_21676", [this.ptr, nameID, value]);
    }
    SetTexture_name_value_element(name, value, element) {
      window.ctx.call("UnityEngine.Material", "SetTexture_21677", [this.ptr, name, value, element]);
    }
    SetTexture_nameID_value_element(nameID, value, element) {
      window.ctx.call("UnityEngine.Material", "SetTexture_21678", [this.ptr, nameID, value, element]);
    }
    SetTextureImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetTextureImpl", [this.ptr, arg0, arg1]);
    }
    static SetTextureImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetTextureImpl_Injected", [arg0, arg1, arg2]);
    }
    SetTextureOffset_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetTextureOffset_21735", [this.ptr, name, value]);
    }
    SetTextureOffset_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetTextureOffset_21736", [this.ptr, nameID, value]);
    }
    SetTextureOffsetImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetTextureOffsetImpl", [this.ptr, arg0, arg1]);
    }
    static SetTextureOffsetImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetTextureOffsetImpl_Injected", [arg0, arg1, arg2]);
    }
    SetTextureScale_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetTextureScale_21737", [this.ptr, name, value]);
    }
    SetTextureScale_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetTextureScale_21738", [this.ptr, nameID, value]);
    }
    SetTextureScaleImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "SetTextureScaleImpl", [this.ptr, arg0, arg1]);
    }
    static SetTextureScaleImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetTextureScaleImpl_Injected", [arg0, arg1, arg2]);
    }
    SetVector_name_value(name, value) {
      window.ctx.call("UnityEngine.Material", "SetVector_21671", [this.ptr, name, value]);
    }
    SetVector_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Material", "SetVector_21672", [this.ptr, nameID, value]);
    }
    SetVectorArray_name_values_count(name, values, count) {
      window.ctx.call("UnityEngine.Material", "SetVectorArray_21656", [this.ptr, name, values, count]);
    }
    SetVectorArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "SetVectorArray_21695", [this.ptr, name, values]);
    }
    SetVectorArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "SetVectorArray_21696", [this.ptr, nameID, values]);
    }
    SetVectorArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Material", "SetVectorArray_21697", [this.ptr, name, values]);
    }
    SetVectorArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Material", "SetVectorArray_21698", [this.ptr, nameID, values]);
    }
    SetVectorArrayImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Material", "SetVectorArrayImpl", [this.ptr, arg0, arg1, arg2]);
    }
    static SetVectorArrayImpl_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Material", "SetVectorArrayImpl_Injected", [arg0, arg1, arg2, arg3]);
    }
    static get_doubleSidedGI_Injected(arg0) {
      return window.ctx.call("UnityEngine.Material", "get_doubleSidedGI_Injected", [arg0]).val() === 1;
    }
    static get_enableInstancing_Injected(arg0) {
      return window.ctx.call("UnityEngine.Material", "get_enableInstancing_Injected", [arg0]).val() === 1;
    }
    static get_globalIlluminationFlags_Injected(arg0) {
      return new MaterialGlobalIlluminationFlags(
        window.ctx.call("UnityEngine.Material", "get_globalIlluminationFlags_Injected", [arg0]),
      );
    }
    static get_passCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Material", "get_passCount_Injected", [arg0]).val();
    }
    static get_rawRenderQueue_Injected(arg0) {
      return window.ctx.call("UnityEngine.Material", "get_rawRenderQueue_Injected", [arg0]).val();
    }
    static get_renderQueue_Injected(arg0) {
      return window.ctx.call("UnityEngine.Material", "get_renderQueue_Injected", [arg0]).val();
    }
    static get_shader_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Material", "get_shader_Injected", [out, arg0]);
        return out;
      })();
    }
    static set_doubleSidedGI_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "set_doubleSidedGI_Injected", [arg0, arg1]);
    }
    static set_enableInstancing_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "set_enableInstancing_Injected", [arg0, arg1]);
    }
    static set_globalIlluminationFlags_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "set_globalIlluminationFlags_Injected", [arg0, arg1]);
    }
    static set_renderQueue_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "set_renderQueue_Injected", [arg0, arg1]);
    }
    static set_shader_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Material", "set_shader_Injected", [arg0, arg1]);
    }
  }
  class StereoTargetEyeMask {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class TransparencySortMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class CameraDistanceRaycaster {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get cameraTargetTransform() {
      return new Transform(this.ptr.readField(20, "i32"));
    }
    set cameraTargetTransform(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get cameraTransform() {
      return new Transform(this.ptr.readField(16, "i32"));
    }
    set cameraTransform(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get castType() {
      return this.ptr.readField(28, "i32");
    }
    set castType(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get currentDistance() {
      return this.ptr.readField(48, "f32").val();
    }
    set currentDistance(value) {
      return this.ptr.writeField(48, "f32", value);
    }
    get distanceMultiplier() {
      return this.ptr.readField(76, "f32").val();
    }
    set distanceMultiplier(value) {
      return this.ptr.writeField(76, "f32", value);
    }
    get distanceMultiplierOverride() {
      return this.ptr.readField(92, "f32").val();
    }
    set distanceMultiplierOverride(value) {
      return this.ptr.writeField(92, "f32", value);
    }
    get ignoreList() {
      return JSArray(this.ptr.readField(40, "i32"));
    }
    set ignoreList(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get ignoreListLayers() {
      return JSArray(this.ptr.readField(44, "i32"));
    }
    set ignoreListLayers(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get ignoreRaycastLayer() {
      return this.ptr.readField(36, "i32").val();
    }
    set ignoreRaycastLayer(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get layerMask() {
      return new LayerMask(this.ptr.readField(32, "i32"));
    }
    set layerMask(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get maxDistanceMultiplier() {
      return this.ptr.readField(84, "f32").val();
    }
    set maxDistanceMultiplier(value) {
      return this.ptr.writeField(84, "f32", value);
    }
    get minDistanceMultiplier() {
      return this.ptr.readField(80, "f32").val();
    }
    set minDistanceMultiplier(value) {
      return this.ptr.writeField(80, "f32", value);
    }
    get minimumDistanceFromObstacles() {
      return this.ptr.readField(52, "f32").val();
    }
    set minimumDistanceFromObstacles(value) {
      return this.ptr.writeField(52, "f32", value);
    }
    get originalCameraTargetPosition() {
      return new Vector3(this.ptr.readField(64, "i32"));
    }
    set originalCameraTargetPosition(value) {
      return this.ptr.writeField(64, "i32", value);
    }
    get originalDistanceMultiplier() {
      return this.ptr.readField(96, "f32").val();
    }
    set originalDistanceMultiplier(value) {
      return this.ptr.writeField(96, "f32", value);
    }
    get scrollSensitivity() {
      return this.ptr.readField(88, "f32").val();
    }
    set scrollSensitivity(value) {
      return this.ptr.writeField(88, "f32", value);
    }
    get smoothingFactor() {
      return this.ptr.readField(56, "f32").val();
    }
    set smoothingFactor(value) {
      return this.ptr.writeField(56, "f32", value);
    }
    get spherecastRadius() {
      return this.ptr.readField(60, "f32").val();
    }
    set spherecastRadius(value) {
      return this.ptr.writeField(60, "f32", value);
    }
    get tr() {
      return new Transform(this.ptr.readField(24, "i32"));
    }
    set tr(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    Awake() {
      window.ctx.call("CameraDistanceRaycaster", "Awake", [this.ptr]);
    }
    GetCameraDistance() {
      return window.ctx.call("CameraDistanceRaycaster", "GetCameraDistance", [this.ptr]).val();
    }
    LateUpdate() {
      window.ctx.call("CameraDistanceRaycaster", "LateUpdate", [this.ptr]);
    }
    OverrideDistanceMultiplier(arg0) {
      window.ctx.call("CameraDistanceRaycaster", "OverrideDistanceMultiplier", [this.ptr, arg0]);
    }
  }
  class Avatar {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get isHuman() {
      return window.ctx.call("UnityEngine.Avatar", "get_isHuman", [this.ptr]).val() === 1;
    }
    get isValid() {
      return window.ctx.call("UnityEngine.Avatar", "get_isValid", [this.ptr]).val() === 1;
    }
    static get_isHuman_Injected(arg0) {
      return window.ctx.call("UnityEngine.Avatar", "get_isHuman_Injected", [arg0]).val() === 1;
    }
    static get_isValid_Injected(arg0) {
      return window.ctx.call("UnityEngine.Avatar", "get_isValid_Injected", [arg0]).val() === 1;
    }
  }
  class AnimatorCullingMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class AnimatorRecorderMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class AnimatorUpdateMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ScriptableObject {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    static CreateInstance_type(type) {
      return new ScriptableObject(window.ctx.call("UnityEngine.ScriptableObject", "CreateInstance_3377", [type]));
    }
    static CreateInstance() {
      return window.ctx.call("UnityEngine.ScriptableObject", "CreateInstance", []);
    }
    static CreateScriptableObject(arg0) {
      window.ctx.call("UnityEngine.ScriptableObject", "CreateScriptableObject", [arg0]);
    }
    static CreateScriptableObjectInstanceFromType(arg0, arg1) {
      return new ScriptableObject(
        window.ctx.call("UnityEngine.ScriptableObject", "CreateScriptableObjectInstanceFromType", [arg0, arg1]),
      );
    }
    static CreateScriptableObjectInstanceFromType_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ScriptableObject", "CreateScriptableObjectInstanceFromType_Injected", [
          out,
          arg0,
          arg1,
        ]);
        return out;
      })();
    }
  }
  class AnimatorControllerParameter {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get name() {
      return window.ctx.call("UnityEngine.AnimatorControllerParameter", "get_name", [this.ptr]);
    }
    get m_DefaultBool() {
      return this.ptr.readField(24, "i32").val() === 1;
    }
    set m_DefaultBool(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get m_DefaultFloat() {
      return this.ptr.readField(16, "f32").val();
    }
    set m_DefaultFloat(value) {
      return this.ptr.writeField(16, "f32", value);
    }
    get m_DefaultInt() {
      return this.ptr.readField(20, "i32").val();
    }
    set m_DefaultInt(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get m_Name() {
      return this.ptr.readField(8, "i32").mstr();
    }
    set m_Name(value) {
      return this.ptr.writeField(8, "i32", window.ctx.createMstr(value));
    }
    get m_Type() {
      return new AnimatorControllerParameterType(this.ptr.readField(12, "i32"));
    }
    set m_Type(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    Equals(arg0) {
      return window.ctx.call("UnityEngine.AnimatorControllerParameter", "Equals", [this.ptr, arg0]).val() === 1;
    }
    GetHashCode() {
      return window.ctx.call("UnityEngine.AnimatorControllerParameter", "GetHashCode", [this.ptr]).val();
    }
  }
  class TrailRenderer {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get alignment() {
      return new TrailRendererAlignment(window.ctx.call("UnityEngine.TrailRenderer", "get_alignment", [this.ptr]));
    }
    set alignment(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_alignment", [this.ptr, value]);
    }
    get applyActiveColorSpace() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_applyActiveColorSpace", [this.ptr]).val() === 1;
    }
    set applyActiveColorSpace(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_applyActiveColorSpace", [this.ptr, value]);
    }
    get autodestruct() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_autodestruct", [this.ptr]).val() === 1;
    }
    set autodestruct(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_autodestruct", [this.ptr, value]);
    }
    get colorGradient() {
      return new Gradient(window.ctx.call("UnityEngine.TrailRenderer", "get_colorGradient", [this.ptr]));
    }
    set colorGradient(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_colorGradient", [this.ptr, value]);
    }
    get emitting() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_emitting", [this.ptr]).val() === 1;
    }
    set emitting(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_emitting", [this.ptr, value]);
    }
    get endColor() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.TrailRenderer", "get_endColor", [out, this.ptr]);
        return out;
      })();
    }
    set endColor(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_endColor", [this.ptr, value]);
    }
    get endWidth() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_endWidth", [this.ptr]).val();
    }
    set endWidth(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_endWidth", [this.ptr, value]);
    }
    get generateLightingData() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_generateLightingData", [this.ptr]).val() === 1;
    }
    set generateLightingData(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_generateLightingData", [this.ptr, value]);
    }
    get maskInteraction() {
      return new TrailRendererMaskInteraction(
        window.ctx.call("UnityEngine.TrailRenderer", "get_maskInteraction", [this.ptr]),
      );
    }
    set maskInteraction(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_maskInteraction", [this.ptr, value]);
    }
    get minVertexDistance() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_minVertexDistance", [this.ptr]).val();
    }
    set minVertexDistance(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_minVertexDistance", [this.ptr, value]);
    }
    get numCapVertices() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_numCapVertices", [this.ptr]).val();
    }
    set numCapVertices(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_numCapVertices", [this.ptr, value]);
    }
    get numCornerVertices() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_numCornerVertices", [this.ptr]).val();
    }
    set numCornerVertices(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_numCornerVertices", [this.ptr, value]);
    }
    get numPositions() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_numPositions", [this.ptr]).val();
    }
    get positionCount() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_positionCount", [this.ptr]).val();
    }
    get shadowBias() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_shadowBias", [this.ptr]).val();
    }
    set shadowBias(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_shadowBias", [this.ptr, value]);
    }
    get startColor() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.TrailRenderer", "get_startColor", [out, this.ptr]);
        return out;
      })();
    }
    set startColor(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_startColor", [this.ptr, value]);
    }
    get startWidth() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_startWidth", [this.ptr]).val();
    }
    set startWidth(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_startWidth", [this.ptr, value]);
    }
    get textureMode() {
      return new TrailRendererTextureMode(window.ctx.call("UnityEngine.TrailRenderer", "get_textureMode", [this.ptr]));
    }
    set textureMode(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_textureMode", [this.ptr, value]);
    }
    get textureScale() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.TrailRenderer", "get_textureScale", [out, this.ptr]);
        return out;
      })();
    }
    set textureScale(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_textureScale", [this.ptr, value]);
    }
    get time() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_time", [this.ptr]).val();
    }
    set time(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_time", [this.ptr, value]);
    }
    get widthCurve() {
      return new AnimationCurve(window.ctx.call("UnityEngine.TrailRenderer", "get_widthCurve", [this.ptr]));
    }
    set widthCurve(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_widthCurve", [this.ptr, value]);
    }
    get widthMultiplier() {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_widthMultiplier", [this.ptr]).val();
    }
    set widthMultiplier(value) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_widthMultiplier", [this.ptr, value]);
    }
    AddPosition(arg0) {
      window.ctx.call("UnityEngine.TrailRenderer", "AddPosition", [this.ptr, arg0]);
    }
    static AddPosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "AddPosition_Injected", [arg0, arg1]);
    }
    AddPositions_positions(positions) {
      window.ctx.call("UnityEngine.TrailRenderer", "AddPositions_21048", [this.ptr, positions]);
    }
    AddPositions_positions(positions) {
      window.ctx.call("UnityEngine.TrailRenderer", "AddPositions_21055", [this.ptr, positions]);
    }
    AddPositions_positions(positions) {
      window.ctx.call("UnityEngine.TrailRenderer", "AddPositions_21056", [this.ptr, positions]);
    }
    AddPositionsWithNativeContainer(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "AddPositionsWithNativeContainer", [this.ptr, arg0, arg1]);
    }
    static AddPositionsWithNativeContainer_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.TrailRenderer", "AddPositionsWithNativeContainer_Injected", [arg0, arg1, arg2]);
    }
    static AddPositions_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "AddPositions_Injected", [arg0, arg1]);
    }
    BakeMesh_mesh_useTransform(mesh, useTransform) {
      window.ctx.call("UnityEngine.TrailRenderer", "BakeMesh_21034", [this.ptr, mesh, useTransform]);
    }
    BakeMesh_mesh_camera_useTransform(mesh, camera, useTransform) {
      window.ctx.call("UnityEngine.TrailRenderer", "BakeMesh_21035", [this.ptr, mesh, camera, useTransform]);
    }
    static BakeMesh_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.TrailRenderer", "BakeMesh_Injected", [arg0, arg1, arg2, arg3]);
    }
    Clear() {
      window.ctx.call("UnityEngine.TrailRenderer", "Clear", [this.ptr]);
    }
    static Clear_Injected(arg0) {
      window.ctx.call("UnityEngine.TrailRenderer", "Clear_Injected", [arg0]);
    }
    GetColorGradientCopy() {
      return new Gradient(window.ctx.call("UnityEngine.TrailRenderer", "GetColorGradientCopy", [this.ptr]));
    }
    static GetColorGradientCopy_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.TrailRenderer", "GetColorGradientCopy_Injected", [out, arg0]);
        return out;
      })();
    }
    GetPosition(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.TrailRenderer", "GetPosition", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetPosition_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.TrailRenderer", "GetPosition_Injected", [arg0, arg1, arg2]);
    }
    GetPositions_positions(positions) {
      return window.ctx.call("UnityEngine.TrailRenderer", "GetPositions_21044", [this.ptr, positions]).val();
    }
    GetPositions_positions(positions) {
      return window.ctx.call("UnityEngine.TrailRenderer", "GetPositions_21051", [this.ptr, positions]).val();
    }
    GetPositions_positions(positions) {
      return window.ctx.call("UnityEngine.TrailRenderer", "GetPositions_21052", [this.ptr, positions]).val();
    }
    GetPositionsWithNativeContainer(arg0, arg1) {
      return window.ctx
        .call("UnityEngine.TrailRenderer", "GetPositionsWithNativeContainer", [this.ptr, arg0, arg1])
        .val();
    }
    static GetPositionsWithNativeContainer_Injected(arg0, arg1, arg2) {
      return window.ctx
        .call("UnityEngine.TrailRenderer", "GetPositionsWithNativeContainer_Injected", [arg0, arg1, arg2])
        .val();
    }
    static GetPositions_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.TrailRenderer", "GetPositions_Injected", [arg0, arg1]).val();
    }
    GetVisiblePositions_positions(positions) {
      return window.ctx.call("UnityEngine.TrailRenderer", "GetVisiblePositions_21045", [this.ptr, positions]).val();
    }
    GetVisiblePositions_positions(positions) {
      return window.ctx.call("UnityEngine.TrailRenderer", "GetVisiblePositions_21053", [this.ptr, positions]).val();
    }
    GetVisiblePositions_positions(positions) {
      return window.ctx.call("UnityEngine.TrailRenderer", "GetVisiblePositions_21054", [this.ptr, positions]).val();
    }
    GetVisiblePositionsWithNativeContainer(arg0, arg1) {
      return window.ctx
        .call("UnityEngine.TrailRenderer", "GetVisiblePositionsWithNativeContainer", [this.ptr, arg0, arg1])
        .val();
    }
    static GetVisiblePositionsWithNativeContainer_Injected(arg0, arg1, arg2) {
      return window.ctx
        .call("UnityEngine.TrailRenderer", "GetVisiblePositionsWithNativeContainer_Injected", [arg0, arg1, arg2])
        .val();
    }
    static GetVisiblePositions_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.TrailRenderer", "GetVisiblePositions_Injected", [arg0, arg1]).val();
    }
    GetWidthCurveCopy() {
      return new AnimationCurve(window.ctx.call("UnityEngine.TrailRenderer", "GetWidthCurveCopy", [this.ptr]));
    }
    static GetWidthCurveCopy_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.TrailRenderer", "GetWidthCurveCopy_Injected", [out, arg0]);
        return out;
      })();
    }
    SetColorGradient(arg0) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetColorGradient", [this.ptr, arg0]);
    }
    static SetColorGradient_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetColorGradient_Injected", [arg0, arg1]);
    }
    SetPosition(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetPosition", [this.ptr, arg0, arg1]);
    }
    static SetPosition_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetPosition_Injected", [arg0, arg1, arg2]);
    }
    SetPositions_positions(positions) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetPositions_21046", [this.ptr, positions]);
    }
    SetPositions_positions(positions) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetPositions_21049", [this.ptr, positions]);
    }
    SetPositions_positions(positions) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetPositions_21050", [this.ptr, positions]);
    }
    SetPositionsWithNativeContainer(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetPositionsWithNativeContainer", [this.ptr, arg0, arg1]);
    }
    static SetPositionsWithNativeContainer_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetPositionsWithNativeContainer_Injected", [arg0, arg1, arg2]);
    }
    static SetPositions_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetPositions_Injected", [arg0, arg1]);
    }
    SetWidthCurve(arg0) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetWidthCurve", [this.ptr, arg0]);
    }
    static SetWidthCurve_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "SetWidthCurve_Injected", [arg0, arg1]);
    }
    static get_alignment_Injected(arg0) {
      return new TrailRendererAlignment(window.ctx.call("UnityEngine.TrailRenderer", "get_alignment_Injected", [arg0]));
    }
    static get_applyActiveColorSpace_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_applyActiveColorSpace_Injected", [arg0]).val() === 1;
    }
    static get_autodestruct_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_autodestruct_Injected", [arg0]).val() === 1;
    }
    static get_emitting_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_emitting_Injected", [arg0]).val() === 1;
    }
    static get_endColor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "get_endColor_Injected", [arg0, arg1]);
    }
    static get_endWidth_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_endWidth_Injected", [arg0]).val();
    }
    static get_generateLightingData_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_generateLightingData_Injected", [arg0]).val() === 1;
    }
    static get_maskInteraction_Injected(arg0) {
      return new TrailRendererMaskInteraction(
        window.ctx.call("UnityEngine.TrailRenderer", "get_maskInteraction_Injected", [arg0]),
      );
    }
    static get_minVertexDistance_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_minVertexDistance_Injected", [arg0]).val();
    }
    static get_numCapVertices_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_numCapVertices_Injected", [arg0]).val();
    }
    static get_numCornerVertices_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_numCornerVertices_Injected", [arg0]).val();
    }
    static get_positionCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_positionCount_Injected", [arg0]).val();
    }
    static get_shadowBias_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_shadowBias_Injected", [arg0]).val();
    }
    static get_startColor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "get_startColor_Injected", [arg0, arg1]);
    }
    static get_startWidth_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_startWidth_Injected", [arg0]).val();
    }
    static get_textureMode_Injected(arg0) {
      return new TrailRendererTextureMode(
        window.ctx.call("UnityEngine.TrailRenderer", "get_textureMode_Injected", [arg0]),
      );
    }
    static get_textureScale_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "get_textureScale_Injected", [arg0, arg1]);
    }
    static get_time_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_time_Injected", [arg0]).val();
    }
    static get_widthMultiplier_Injected(arg0) {
      return window.ctx.call("UnityEngine.TrailRenderer", "get_widthMultiplier_Injected", [arg0]).val();
    }
    static set_alignment_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_alignment_Injected", [arg0, arg1]);
    }
    static set_applyActiveColorSpace_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_applyActiveColorSpace_Injected", [arg0, arg1]);
    }
    static set_autodestruct_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_autodestruct_Injected", [arg0, arg1]);
    }
    static set_emitting_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_emitting_Injected", [arg0, arg1]);
    }
    static set_endColor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_endColor_Injected", [arg0, arg1]);
    }
    static set_endWidth_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_endWidth_Injected", [arg0, arg1]);
    }
    static set_generateLightingData_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_generateLightingData_Injected", [arg0, arg1]);
    }
    static set_maskInteraction_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_maskInteraction_Injected", [arg0, arg1]);
    }
    static set_minVertexDistance_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_minVertexDistance_Injected", [arg0, arg1]);
    }
    static set_numCapVertices_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_numCapVertices_Injected", [arg0, arg1]);
    }
    static set_numCornerVertices_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_numCornerVertices_Injected", [arg0, arg1]);
    }
    static set_shadowBias_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_shadowBias_Injected", [arg0, arg1]);
    }
    static set_startColor_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_startColor_Injected", [arg0, arg1]);
    }
    static set_startWidth_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_startWidth_Injected", [arg0, arg1]);
    }
    static set_textureMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_textureMode_Injected", [arg0, arg1]);
    }
    static set_textureScale_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_textureScale_Injected", [arg0, arg1]);
    }
    static set_time_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_time_Injected", [arg0, arg1]);
    }
    static set_widthMultiplier_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.TrailRenderer", "set_widthMultiplier_Injected", [arg0, arg1]);
    }
  }
  class AudioDataLoadState {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class AudioClipLoadType {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ParticleSystemExtension {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get isPlaying() {
      return window.ctx.call("ParticleSystemExtension", "get_isPlaying", [this.ptr]).val() === 1;
    }
    set isPlaying(value) {
      window.ctx.call("ParticleSystemExtension", "set_isPlaying", [this.ptr, value]);
    }
    get _isPlaying() {
      return this.ptr.readField(20, "i32").val() === 1;
    }
    set _isPlaying(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get myParticleSystem() {
      return new ParticleSystem(this.ptr.readField(16, "i32"));
    }
    set myParticleSystem(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    Awake() {
      window.ctx.call("ParticleSystemExtension", "Awake", [this.ptr]);
    }
    Start() {
      window.ctx.call("ParticleSystemExtension", "Start", [this.ptr]);
    }
  }
  class MuzzleFlashMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ParticleSystem {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get automaticCullingEnabled() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_automaticCullingEnabled", [this.ptr]).val() === 1;
    }
    get collision() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_collision", [out, this.ptr]);
        return out;
      })();
    }
    get colorBySpeed() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_colorBySpeed", [out, this.ptr]);
        return out;
      })();
    }
    get colorOverLifetime() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_colorOverLifetime", [out, this.ptr]);
        return out;
      })();
    }
    get customData() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_customData", [out, this.ptr]);
        return out;
      })();
    }
    get duration() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_duration", [this.ptr]).val();
    }
    get emission() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_emission", [out, this.ptr]);
        return out;
      })();
    }
    get emissionRate() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_emissionRate", [this.ptr]).val();
    }
    set emissionRate(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_emissionRate", [this.ptr, value]);
    }
    get enableEmission() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_enableEmission", [this.ptr]).val() === 1;
    }
    set enableEmission(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_enableEmission", [this.ptr, value]);
    }
    get externalForces() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_externalForces", [out, this.ptr]);
        return out;
      })();
    }
    get forceOverLifetime() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_forceOverLifetime", [out, this.ptr]);
        return out;
      })();
    }
    get gravityModifier() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_gravityModifier", [this.ptr]).val();
    }
    set gravityModifier(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_gravityModifier", [this.ptr, value]);
    }
    get has3DParticleRotations() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_has3DParticleRotations", [this.ptr]).val() === 1;
    }
    get hasNonUniformParticleSizes() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_hasNonUniformParticleSizes", [this.ptr]).val() === 1;
    }
    get inheritVelocity() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_inheritVelocity", [out, this.ptr]);
        return out;
      })();
    }
    get isEmitting() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_isEmitting", [this.ptr]).val() === 1;
    }
    get isPaused() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_isPaused", [this.ptr]).val() === 1;
    }
    get isPlaying() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_isPlaying", [this.ptr]).val() === 1;
    }
    get isStopped() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_isStopped", [this.ptr]).val() === 1;
    }
    get lifetimeByEmitterSpeed() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_lifetimeByEmitterSpeed", [out, this.ptr]);
        return out;
      })();
    }
    get lights() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_lights", [out, this.ptr]);
        return out;
      })();
    }
    get limitVelocityOverLifetime() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_limitVelocityOverLifetime", [out, this.ptr]);
        return out;
      })();
    }
    get loop() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_loop", [this.ptr]).val() === 1;
    }
    set loop(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_loop", [this.ptr, value]);
    }
    get main() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_main", [out, this.ptr]);
        return out;
      })();
    }
    get maxParticles() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_maxParticles", [this.ptr]).val();
    }
    set maxParticles(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_maxParticles", [this.ptr, value]);
    }
    get noise() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_noise", [out, this.ptr]);
        return out;
      })();
    }
    get particleCount() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_particleCount", [this.ptr]).val();
    }
    get playbackSpeed() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_playbackSpeed", [this.ptr]).val();
    }
    set playbackSpeed(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_playbackSpeed", [this.ptr, value]);
    }
    get playOnAwake() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_playOnAwake", [this.ptr]).val() === 1;
    }
    set playOnAwake(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_playOnAwake", [this.ptr, value]);
    }
    get proceduralSimulationSupported() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_proceduralSimulationSupported", [this.ptr]).val() === 1;
    }
    get randomSeed() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_randomSeed", [this.ptr]).val();
    }
    set randomSeed(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_randomSeed", [this.ptr, value]);
    }
    get rotationBySpeed() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_rotationBySpeed", [out, this.ptr]);
        return out;
      })();
    }
    get rotationOverLifetime() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_rotationOverLifetime", [out, this.ptr]);
        return out;
      })();
    }
    get scalingMode() {
      return new ParticleSystemScalingMode(
        window.ctx.call("UnityEngine.ParticleSystem", "get_scalingMode", [this.ptr]),
      );
    }
    set scalingMode(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_scalingMode", [this.ptr, value]);
    }
    get shape() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_shape", [out, this.ptr]);
        return out;
      })();
    }
    get simulationSpace() {
      return new ParticleSystemSimulationSpace(
        window.ctx.call("UnityEngine.ParticleSystem", "get_simulationSpace", [this.ptr]),
      );
    }
    set simulationSpace(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_simulationSpace", [this.ptr, value]);
    }
    get sizeBySpeed() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_sizeBySpeed", [out, this.ptr]);
        return out;
      })();
    }
    get sizeOverLifetime() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_sizeOverLifetime", [out, this.ptr]);
        return out;
      })();
    }
    get startColor() {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.ParticleSystem", "get_startColor", [out, this.ptr]);
        return out;
      })();
    }
    set startColor(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_startColor", [this.ptr, value]);
    }
    get startDelay() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_startDelay", [this.ptr]).val();
    }
    set startDelay(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_startDelay", [this.ptr, value]);
    }
    get startLifetime() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_startLifetime", [this.ptr]).val();
    }
    set startLifetime(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_startLifetime", [this.ptr, value]);
    }
    get startRotation() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_startRotation", [this.ptr]).val();
    }
    set startRotation(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_startRotation", [this.ptr, value]);
    }
    get startRotation3D() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.ParticleSystem", "get_startRotation3D", [out, this.ptr]);
        return out;
      })();
    }
    set startRotation3D(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_startRotation3D", [this.ptr, value]);
    }
    get startSize() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_startSize", [this.ptr]).val();
    }
    set startSize(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_startSize", [this.ptr, value]);
    }
    get startSpeed() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_startSpeed", [this.ptr]).val();
    }
    set startSpeed(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_startSpeed", [this.ptr, value]);
    }
    get subEmitters() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_subEmitters", [out, this.ptr]);
        return out;
      })();
    }
    get textureSheetAnimation() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_textureSheetAnimation", [out, this.ptr]);
        return out;
      })();
    }
    get time() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_time", [this.ptr]).val();
    }
    set time(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_time", [this.ptr, value]);
    }
    get totalTime() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_totalTime", [this.ptr]).val();
    }
    get trails() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_trails", [out, this.ptr]);
        return out;
      })();
    }
    get trigger() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_trigger", [out, this.ptr]);
        return out;
      })();
    }
    get useAutoRandomSeed() {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_useAutoRandomSeed", [this.ptr]).val() === 1;
    }
    set useAutoRandomSeed(value) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_useAutoRandomSeed", [this.ptr, value]);
    }
    get velocityOverLifetime() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "get_velocityOverLifetime", [out, this.ptr]);
        return out;
      })();
    }
    AllocateAxisOfRotationAttribute() {
      window.ctx.call("UnityEngine.ParticleSystem", "AllocateAxisOfRotationAttribute", [this.ptr]);
    }
    static AllocateAxisOfRotationAttribute_Injected(arg0) {
      window.ctx.call("UnityEngine.ParticleSystem", "AllocateAxisOfRotationAttribute_Injected", [arg0]);
    }
    AllocateCustomDataAttribute(arg0) {
      window.ctx.call("UnityEngine.ParticleSystem", "AllocateCustomDataAttribute", [this.ptr, arg0]);
    }
    static AllocateCustomDataAttribute_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "AllocateCustomDataAttribute_Injected", [arg0, arg1]);
    }
    AllocateMeshIndexAttribute() {
      window.ctx.call("UnityEngine.ParticleSystem", "AllocateMeshIndexAttribute", [this.ptr]);
    }
    static AllocateMeshIndexAttribute_Injected(arg0) {
      window.ctx.call("UnityEngine.ParticleSystem", "AllocateMeshIndexAttribute_Injected", [arg0]);
    }
    Clear_withChildren(withChildren) {
      window.ctx.call("UnityEngine.ParticleSystem", "Clear_26207", [this.ptr, withChildren]);
    }
    Clear_pointer() {
      window.ctx.call("UnityEngine.ParticleSystem", "Clear_26208", [this.ptr]);
    }
    static Clear_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "Clear_Injected", [arg0, arg1]);
    }
    static CopyManagedJobData(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "CopyManagedJobData", [arg0, arg1]);
    }
    Emit_position_velocity_size_lifetime_color(position, velocity, size, lifetime, color) {
      window.ctx.call("UnityEngine.ParticleSystem", "Emit_26115", [
        this.ptr,
        position,
        velocity,
        size,
        lifetime,
        color,
      ]);
    }
    Emit_particle(particle) {
      window.ctx.call("UnityEngine.ParticleSystem", "Emit_26116", [this.ptr, particle]);
    }
    Emit_count(count) {
      window.ctx.call("UnityEngine.ParticleSystem", "Emit_26211", [this.ptr, count]);
    }
    Emit_emitParams_count(emitParams, count) {
      window.ctx.call("UnityEngine.ParticleSystem", "Emit_26213", [this.ptr, emitParams, count]);
    }
    EmitOld_Internal(arg0) {
      window.ctx.call("UnityEngine.ParticleSystem", "EmitOld_Internal", [this.ptr, arg0]);
    }
    static EmitOld_Internal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "EmitOld_Internal_Injected", [arg0, arg1]);
    }
    static Emit_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.ParticleSystem", "Emit_Injected", [arg0, arg1, arg2]);
    }
    Emit_Internal(arg0) {
      window.ctx.call("UnityEngine.ParticleSystem", "Emit_Internal", [this.ptr, arg0]);
    }
    static Emit_Internal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "Emit_Internal_Injected", [arg0, arg1]);
    }
    GetCustomParticleData(arg0, arg1) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetCustomParticleData", [this.ptr, arg0, arg1]).val();
    }
    static GetCustomParticleData_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetCustomParticleData_Injected", [arg0, arg1, arg2]).val();
    }
    GetManagedJobData() {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetManagedJobData", [this.ptr]);
    }
    static GetManagedJobData_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetManagedJobData_Injected", [arg0]);
    }
    GetManagedJobHandle() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "GetManagedJobHandle", [out, this.ptr]);
        return out;
      })();
    }
    static GetManagedJobHandle_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "GetManagedJobHandle_Injected", [arg0, arg1]);
    }
    GetParticleCurrentColor(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "GetParticleCurrentColor", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetParticleCurrentColor_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.ParticleSystem", "GetParticleCurrentColor_Injected", [arg0, arg1, arg2]);
    }
    GetParticleCurrentSize(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetParticleCurrentSize", [this.ptr, arg0]).val();
    }
    GetParticleCurrentSize3D(arg0) {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.ParticleSystem", "GetParticleCurrentSize3D", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetParticleCurrentSize3D_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.ParticleSystem", "GetParticleCurrentSize3D_Injected", [arg0, arg1, arg2]);
    }
    static GetParticleCurrentSize_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetParticleCurrentSize_Injected", [arg0, arg1]).val();
    }
    GetParticleMeshIndex(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetParticleMeshIndex", [this.ptr, arg0]).val();
    }
    static GetParticleMeshIndex_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetParticleMeshIndex_Injected", [arg0, arg1]).val();
    }
    GetParticles_particles_size_offset(particles, size, offset) {
      return window.ctx
        .call("UnityEngine.ParticleSystem", "GetParticles_26175", [this.ptr, particles, size, offset])
        .val();
    }
    GetParticles_particles_size(particles, size) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetParticles_26176", [this.ptr, particles, size]).val();
    }
    GetParticles_particles(particles) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetParticles_26177", [this.ptr, particles]).val();
    }
    GetParticles_particles_size_offset(particles, size, offset) {
      return window.ctx
        .call("UnityEngine.ParticleSystem", "GetParticles_26179", [this.ptr, particles, size, offset])
        .val();
    }
    GetParticles_particles_size(particles, size) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetParticles_26180", [this.ptr, particles, size]).val();
    }
    GetParticles_particles(particles) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetParticles_26181", [this.ptr, particles]).val();
    }
    GetParticlesWithNativeArray(arg0, arg1, arg2, arg3) {
      return window.ctx
        .call("UnityEngine.ParticleSystem", "GetParticlesWithNativeArray", [this.ptr, arg0, arg1, arg2, arg3])
        .val();
    }
    static GetParticlesWithNativeArray_Injected(arg0, arg1, arg2, arg3, arg4) {
      return window.ctx
        .call("UnityEngine.ParticleSystem", "GetParticlesWithNativeArray_Injected", [arg0, arg1, arg2, arg3, arg4])
        .val();
    }
    static GetParticles_Injected(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetParticles_Injected", [arg0, arg1, arg2, arg3]).val();
    }
    GetPlaybackState() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "GetPlaybackState", [out, this.ptr]);
        return out;
      })();
    }
    static GetPlaybackState_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "GetPlaybackState_Injected", [arg0, arg1]);
    }
    GetTrailDataInternal(arg0) {
      window.ctx.call("UnityEngine.ParticleSystem", "GetTrailDataInternal", [this.ptr, arg0]);
    }
    static GetTrailDataInternal_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "GetTrailDataInternal_Injected", [arg0, arg1]);
    }
    GetTrails_pointer() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "GetTrails_26187", [out, this.ptr]);
        return out;
      })();
    }
    GetTrails_trailData(trailData) {
      return window.ctx.call("UnityEngine.ParticleSystem", "GetTrails_26188", [this.ptr, trailData]).val();
    }
    IsAlive_withChildren(withChildren) {
      return window.ctx.call("UnityEngine.ParticleSystem", "IsAlive_26209", [this.ptr, withChildren]).val() === 1;
    }
    IsAlive_pointer() {
      return window.ctx.call("UnityEngine.ParticleSystem", "IsAlive_26210", [this.ptr]).val() === 1;
    }
    static IsAlive_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.ParticleSystem", "IsAlive_Injected", [arg0, arg1]).val() === 1;
    }
    Pause_withChildren(withChildren) {
      window.ctx.call("UnityEngine.ParticleSystem", "Pause_26202", [this.ptr, withChildren]);
    }
    Pause_pointer() {
      window.ctx.call("UnityEngine.ParticleSystem", "Pause_26203", [this.ptr]);
    }
    static Pause_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "Pause_Injected", [arg0, arg1]);
    }
    Play_withChildren(withChildren) {
      window.ctx.call("UnityEngine.ParticleSystem", "Play_26200", [this.ptr, withChildren]);
    }
    Play_pointer() {
      window.ctx.call("UnityEngine.ParticleSystem", "Play_26201", [this.ptr]);
    }
    static Play_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "Play_Injected", [arg0, arg1]);
    }
    static ResetPreMappedBufferMemory() {
      window.ctx.call("UnityEngine.ParticleSystem", "ResetPreMappedBufferMemory", []);
    }
    static ScheduleManagedJob(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.ParticleSystem", "ScheduleManagedJob", [out, arg0, arg1]);
        return out;
      })();
    }
    static ScheduleManagedJob_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.ParticleSystem", "ScheduleManagedJob_Injected", [arg0, arg1, arg2]);
    }
    SetCustomParticleData(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetCustomParticleData", [this.ptr, arg0, arg1]);
    }
    static SetCustomParticleData_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetCustomParticleData_Injected", [arg0, arg1, arg2]);
    }
    SetManagedJobHandle(arg0) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetManagedJobHandle", [this.ptr, arg0]);
    }
    static SetManagedJobHandle_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetManagedJobHandle_Injected", [arg0, arg1]);
    }
    static SetMaximumPreMappedBufferCounts(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetMaximumPreMappedBufferCounts", [arg0, arg1]);
    }
    SetParticles_particles_size_offset(particles, size, offset) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticles_26168", [this.ptr, particles, size, offset]);
    }
    SetParticles_particles_size(particles, size) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticles_26169", [this.ptr, particles, size]);
    }
    SetParticles_particles(particles) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticles_26170", [this.ptr, particles]);
    }
    SetParticles_particles_size_offset(particles, size, offset) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticles_26172", [this.ptr, particles, size, offset]);
    }
    SetParticles_particles_size(particles, size) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticles_26173", [this.ptr, particles, size]);
    }
    SetParticles_particles(particles) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticles_26174", [this.ptr, particles]);
    }
    SetParticlesAndTrails_particles_trailData_size_offset(particles, trailData, size, offset) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesAndTrails_26189", [
        this.ptr,
        particles,
        trailData,
        size,
        offset,
      ]);
    }
    SetParticlesAndTrails_particles_trailData_size(particles, trailData, size) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesAndTrails_26190", [
        this.ptr,
        particles,
        trailData,
        size,
      ]);
    }
    SetParticlesAndTrails_particles_trailData(particles, trailData) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesAndTrails_26191", [this.ptr, particles, trailData]);
    }
    SetParticlesAndTrails_particles_trailData_size_offset(particles, trailData, size, offset) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesAndTrails_26193", [
        this.ptr,
        particles,
        trailData,
        size,
        offset,
      ]);
    }
    SetParticlesAndTrails_particles_trailData_size(particles, trailData, size) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesAndTrails_26194", [
        this.ptr,
        particles,
        trailData,
        size,
      ]);
    }
    SetParticlesAndTrails_particles_trailData(particles, trailData) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesAndTrails_26195", [this.ptr, particles, trailData]);
    }
    SetParticlesAndTrailsWithNativeArray(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesAndTrailsWithNativeArray", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
      ]);
    }
    static SetParticlesAndTrailsWithNativeArray_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesAndTrailsWithNativeArray_Injected", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
      ]);
    }
    static SetParticlesAndTrails_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesAndTrails_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    SetParticlesWithNativeArray(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesWithNativeArray", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    static SetParticlesWithNativeArray_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticlesWithNativeArray_Injected", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
      ]);
    }
    static SetParticles_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetParticles_Injected", [arg0, arg1, arg2, arg3]);
    }
    SetPlaybackState(arg0) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetPlaybackState", [this.ptr, arg0]);
    }
    static SetPlaybackState_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetPlaybackState_Injected", [arg0, arg1]);
    }
    SetTrails(arg0) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetTrails", [this.ptr, arg0]);
    }
    static SetTrails_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "SetTrails_Injected", [arg0, arg1]);
    }
    Simulate_t_withChildren_restart_fixedTimeStep(t, withChildren, restart, fixedTimeStep) {
      window.ctx.call("UnityEngine.ParticleSystem", "Simulate_26196", [
        this.ptr,
        t,
        withChildren,
        restart,
        fixedTimeStep,
      ]);
    }
    Simulate_t_withChildren_restart(t, withChildren, restart) {
      window.ctx.call("UnityEngine.ParticleSystem", "Simulate_26197", [this.ptr, t, withChildren, restart]);
    }
    Simulate_t_withChildren(t, withChildren) {
      window.ctx.call("UnityEngine.ParticleSystem", "Simulate_26198", [this.ptr, t, withChildren]);
    }
    Simulate_t(t) {
      window.ctx.call("UnityEngine.ParticleSystem", "Simulate_26199", [this.ptr, t]);
    }
    static Simulate_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.ParticleSystem", "Simulate_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    Stop_withChildren_stopBehavior(withChildren, stopBehavior) {
      window.ctx.call("UnityEngine.ParticleSystem", "Stop_26204", [this.ptr, withChildren, stopBehavior]);
    }
    Stop_withChildren(withChildren) {
      window.ctx.call("UnityEngine.ParticleSystem", "Stop_26205", [this.ptr, withChildren]);
    }
    Stop_pointer() {
      window.ctx.call("UnityEngine.ParticleSystem", "Stop_26206", [this.ptr]);
    }
    static Stop_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.ParticleSystem", "Stop_Injected", [arg0, arg1, arg2]);
    }
    TriggerSubEmitter_subEmitterIndex(subEmitterIndex) {
      window.ctx.call("UnityEngine.ParticleSystem", "TriggerSubEmitter_26215", [this.ptr, subEmitterIndex]);
    }
    TriggerSubEmitter_subEmitterIndex_particle(subEmitterIndex, particle) {
      window.ctx.call("UnityEngine.ParticleSystem", "TriggerSubEmitter_26216", [this.ptr, subEmitterIndex, particle]);
    }
    TriggerSubEmitter_subEmitterIndex_particles(subEmitterIndex, particles) {
      window.ctx.call("UnityEngine.ParticleSystem", "TriggerSubEmitter_26217", [this.ptr, subEmitterIndex, particles]);
    }
    TriggerSubEmitterForAllParticles(arg0) {
      window.ctx.call("UnityEngine.ParticleSystem", "TriggerSubEmitterForAllParticles", [this.ptr, arg0]);
    }
    static TriggerSubEmitterForAllParticles_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "TriggerSubEmitterForAllParticles_Injected", [arg0, arg1]);
    }
    TriggerSubEmitterForParticle(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "TriggerSubEmitterForParticle", [this.ptr, arg0, arg1]);
    }
    static TriggerSubEmitterForParticle_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.ParticleSystem", "TriggerSubEmitterForParticle_Injected", [arg0, arg1, arg2]);
    }
    TriggerSubEmitterForParticles(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "TriggerSubEmitterForParticles", [this.ptr, arg0, arg1]);
    }
    static TriggerSubEmitterForParticles_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.ParticleSystem", "TriggerSubEmitterForParticles_Injected", [arg0, arg1, arg2]);
    }
    static UserJobCanBeScheduled() {
      return window.ctx.call("UnityEngine.ParticleSystem", "UserJobCanBeScheduled", []).val() === 1;
    }
    static get_has3DParticleRotations_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_has3DParticleRotations_Injected", [arg0]).val() === 1;
    }
    static get_hasNonUniformParticleSizes_Injected(arg0) {
      return (
        window.ctx.call("UnityEngine.ParticleSystem", "get_hasNonUniformParticleSizes_Injected", [arg0]).val() === 1
      );
    }
    static get_isEmitting_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_isEmitting_Injected", [arg0]).val() === 1;
    }
    static get_isPaused_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_isPaused_Injected", [arg0]).val() === 1;
    }
    static get_isPlaying_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_isPlaying_Injected", [arg0]).val() === 1;
    }
    static get_isStopped_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_isStopped_Injected", [arg0]).val() === 1;
    }
    static get_particleCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_particleCount_Injected", [arg0]).val();
    }
    static get_proceduralSimulationSupported_Injected(arg0) {
      return (
        window.ctx.call("UnityEngine.ParticleSystem", "get_proceduralSimulationSupported_Injected", [arg0]).val() === 1
      );
    }
    static get_randomSeed_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_randomSeed_Injected", [arg0]).val();
    }
    static get_time_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_time_Injected", [arg0]).val();
    }
    static get_totalTime_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_totalTime_Injected", [arg0]).val();
    }
    static get_useAutoRandomSeed_Injected(arg0) {
      return window.ctx.call("UnityEngine.ParticleSystem", "get_useAutoRandomSeed_Injected", [arg0]).val() === 1;
    }
    static set_randomSeed_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_randomSeed_Injected", [arg0, arg1]);
    }
    static set_time_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_time_Injected", [arg0, arg1]);
    }
    static set_useAutoRandomSeed_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.ParticleSystem", "set_useAutoRandomSeed_Injected", [arg0, arg1]);
    }
  }
  class Texture {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    set anisoLevel(value) {
      window.ctx.call("UnityEngine.Texture", "set_anisoLevel", [this.ptr, value]);
    }
    get dimension() {
      return new TextureDimension(window.ctx.call("UnityEngine.Texture", "get_dimension", [this.ptr]));
    }
    set dimension(value) {
      window.ctx.call("UnityEngine.Texture", "set_dimension", [this.ptr, value]);
    }
    set filterMode(value) {
      window.ctx.call("UnityEngine.Texture", "set_filterMode", [this.ptr, value]);
    }
    get height() {
      return window.ctx.call("UnityEngine.Texture", "get_height", [this.ptr]).val();
    }
    set height(value) {
      window.ctx.call("UnityEngine.Texture", "set_height", [this.ptr, value]);
    }
    get isReadable() {
      return window.ctx.call("UnityEngine.Texture", "get_isReadable", [this.ptr]).val() === 1;
    }
    get mipmapCount() {
      return window.ctx.call("UnityEngine.Texture", "get_mipmapCount", [this.ptr]).val();
    }
    get texelSize() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Texture", "get_texelSize", [out, this.ptr]);
        return out;
      })();
    }
    get width() {
      return window.ctx.call("UnityEngine.Texture", "get_width", [this.ptr]).val();
    }
    set width(value) {
      window.ctx.call("UnityEngine.Texture", "set_width", [this.ptr, value]);
    }
    get wrapMode() {
      return new TextureWrapMode(window.ctx.call("UnityEngine.Texture", "get_wrapMode", [this.ptr]));
    }
    set wrapMode(value) {
      window.ctx.call("UnityEngine.Texture", "set_wrapMode", [this.ptr, value]);
    }
    get GenerateAllMips() {
      return this.ptr.readField(0, "i32").val();
    }
    set GenerateAllMips(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    CreateNativeArrayLengthOverflowException() {
      return window.ctx.call("UnityEngine.Texture", "CreateNativeArrayLengthOverflowException", [this.ptr]);
    }
    CreateNonReadableException(arg0) {
      return window.ctx.call("UnityEngine.Texture", "CreateNonReadableException", [this.ptr, arg0]);
    }
    GetDataHeight() {
      return window.ctx.call("UnityEngine.Texture", "GetDataHeight", [this.ptr]).val();
    }
    static GetDataHeight_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture", "GetDataHeight_Injected", [arg0]).val();
    }
    GetDataWidth() {
      return window.ctx.call("UnityEngine.Texture", "GetDataWidth", [this.ptr]).val();
    }
    static GetDataWidth_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture", "GetDataWidth_Injected", [arg0]).val();
    }
    GetDimension() {
      return new TextureDimension(window.ctx.call("UnityEngine.Texture", "GetDimension", [this.ptr]));
    }
    static GetDimension_Injected(arg0) {
      return new TextureDimension(window.ctx.call("UnityEngine.Texture", "GetDimension_Injected", [arg0]));
    }
    GetPixelDataOffset(arg0, arg1) {
      return window.ctx.call("UnityEngine.Texture", "GetPixelDataOffset", [this.ptr, arg0, arg1]).val();
    }
    static GetPixelDataOffset_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Texture", "GetPixelDataOffset_Injected", [arg0, arg1, arg2]).val();
    }
    GetPixelDataSize(arg0, arg1) {
      return window.ctx.call("UnityEngine.Texture", "GetPixelDataSize", [this.ptr, arg0, arg1]).val();
    }
    static GetPixelDataSize_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Texture", "GetPixelDataSize_Injected", [arg0, arg1, arg2]).val();
    }
    GetTextureColorSpace_linear(linear) {
      return new TextureColorSpace(
        window.ctx.call("UnityEngine.Texture", "GetTextureColorSpace_22625", [this.ptr, linear]),
      );
    }
    GetTextureColorSpace_format(format) {
      return new TextureColorSpace(
        window.ctx.call("UnityEngine.Texture", "GetTextureColorSpace_22626", [this.ptr, format]),
      );
    }
    IgnoreMipmapLimitCannotBeToggledException(arg0) {
      return window.ctx.call("UnityEngine.Texture", "IgnoreMipmapLimitCannotBeToggledException", [this.ptr, arg0]);
    }
    ValidateFormat_format(format) {
      return window.ctx.call("UnityEngine.Texture", "ValidateFormat_22627", [this.ptr, format]).val() === 1;
    }
    ValidateFormat_format_usage(format, usage) {
      return window.ctx.call("UnityEngine.Texture", "ValidateFormat_22628", [this.ptr, format, usage]).val() === 1;
    }
    static get_isReadable_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture", "get_isReadable_Injected", [arg0]).val() === 1;
    }
    static get_mipmapCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture", "get_mipmapCount_Injected", [arg0]).val();
    }
    static get_texelSize_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture", "get_texelSize_Injected", [arg0, arg1]);
    }
    static get_wrapMode_Injected(arg0) {
      return new TextureWrapMode(window.ctx.call("UnityEngine.Texture", "get_wrapMode_Injected", [arg0]));
    }
    static set_anisoLevel_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture", "set_anisoLevel_Injected", [arg0, arg1]);
    }
    static set_filterMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture", "set_filterMode_Injected", [arg0, arg1]);
    }
    static set_wrapMode_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture", "set_wrapMode_Injected", [arg0, arg1]);
    }
  }
  class IAudioGenerator {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    CreateInstance(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Audio.IAudioGenerator", "CreateInstance", [out, this.ptr, arg0, arg1, arg2]);
        return out;
      })();
    }
  }
  class UnityObject {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get hideFlags() {
      return new HideFlags(window.ctx.call("UnityEngine.Object", "get_hideFlags", [this.ptr]));
    }
    set hideFlags(value) {
      window.ctx.call("UnityEngine.Object", "set_hideFlags", [this.ptr, value]);
    }
    get name() {
      return window.ctx.call("UnityEngine.Object", "get_name", [this.ptr]);
    }
    set name(value) {
      window.ctx.call("UnityEngine.Object", "set_name", [this.ptr, value]);
    }
    get OffsetOfInstanceIDInCPlusPlusObject() {
      return this.ptr.readField(0, "i32").val();
    }
    set OffsetOfInstanceIDInCPlusPlusObject(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get m_CachedPtr() {
      return this.ptr.readField(8, "i32");
    }
    set m_CachedPtr(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    static CheckNullArgument(arg0, arg1) {
      window.ctx.call("UnityEngine.Object", "CheckNullArgument", [arg0, arg1]);
    }
    static CompareBaseObjects(arg0, arg1) {
      return window.ctx.call("UnityEngine.Object", "CompareBaseObjects", [arg0, arg1]).val() === 1;
    }
    static CurrentThreadIsMainThread() {
      return window.ctx.call("UnityEngine.Object", "CurrentThreadIsMainThread", []).val() === 1;
    }
    static Destroy_obj_t(obj, t) {
      window.ctx.call("UnityEngine.Object", "Destroy_2675", [obj, t]);
    }
    static Destroy_obj(obj) {
      window.ctx.call("UnityEngine.Object", "Destroy_1924", [obj]);
    }
    static DestroyImmediate_obj_allowDestroyingAssets(obj, allowDestroyingAssets) {
      window.ctx.call("UnityEngine.Object", "DestroyImmediate_24048", [obj, allowDestroyingAssets]);
    }
    static DestroyImmediate_obj(obj) {
      window.ctx.call("UnityEngine.Object", "DestroyImmediate_24049", [obj]);
    }
    static DestroyImmediate_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Object", "DestroyImmediate_Injected", [arg0, arg1]);
    }
    static DestroyObject_obj_t(obj, t) {
      window.ctx.call("UnityEngine.Object", "DestroyObject_24057", [obj, t]);
    }
    static DestroyObject_obj(obj) {
      window.ctx.call("UnityEngine.Object", "DestroyObject_24058", [obj]);
    }
    static Destroy_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Object", "Destroy_Injected", [arg0, arg1]);
    }
    static DoesObjectWithInstanceIDExist(arg0) {
      return window.ctx.call("UnityEngine.Object", "DoesObjectWithInstanceIDExist", [arg0]).val() === 1;
    }
    static DoesObjectWithInstanceIDExist_Injected(arg0) {
      return window.ctx.call("UnityEngine.Object", "DoesObjectWithInstanceIDExist_Injected", [arg0]).val() === 1;
    }
    static DontDestroyOnLoad(arg0) {
      window.ctx.call("UnityEngine.Object", "DontDestroyOnLoad", [arg0]);
    }
    static DontDestroyOnLoad_Injected(arg0) {
      window.ctx.call("UnityEngine.Object", "DontDestroyOnLoad_Injected", [arg0]);
    }
    EnsureRunningOnMainThread() {
      window.ctx.call("UnityEngine.Object", "EnsureRunningOnMainThread", [this.ptr]);
    }
    Equals(arg0) {
      return window.ctx.call("UnityEngine.Object", "Equals", [this.ptr, arg0]).val() === 1;
    }
    static FindAnyObjectByType() {
      return window.ctx.call("UnityEngine.Object", "FindAnyObjectByType", []);
    }
    static FindAnyObjectByType(arg0) {
      return window.ctx.call("UnityEngine.Object", "FindAnyObjectByType", [arg0]);
    }
    static FindAnyObjectByType_type(type) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "FindAnyObjectByType_24065", [type]));
    }
    static FindAnyObjectByType_type_findObjectsInactive(type, findObjectsInactive) {
      return new UnityObject(
        window.ctx.call("UnityEngine.Object", "FindAnyObjectByType_24068", [type, findObjectsInactive]),
      );
    }
    static FindFirstObjectByType() {
      return window.ctx.call("UnityEngine.Object", "FindFirstObjectByType", []);
    }
    static FindFirstObjectByType(arg0) {
      return window.ctx.call("UnityEngine.Object", "FindFirstObjectByType", [arg0]);
    }
    static FindFirstObjectByType_type(type) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "FindFirstObjectByType_24064", [type]));
    }
    static FindFirstObjectByType_type_findObjectsInactive(type, findObjectsInactive) {
      return new UnityObject(
        window.ctx.call("UnityEngine.Object", "FindFirstObjectByType_24067", [type, findObjectsInactive]),
      );
    }
    static FindObjectFromInstanceID(arg0) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "FindObjectFromInstanceID", [arg0]));
    }
    static FindObjectFromInstanceID_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "FindObjectFromInstanceID_Injected", [out, arg0]);
        return out;
      })();
    }
    static FindObjectOfType() {
      return window.ctx.call("UnityEngine.Object", "FindObjectOfType", []);
    }
    static FindObjectOfType(arg0) {
      return window.ctx.call("UnityEngine.Object", "FindObjectOfType", [arg0]);
    }
    static FindObjectOfType_type(type) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "FindObjectOfType_24063", [type]));
    }
    static FindObjectOfType_type_includeInactive(type, includeInactive) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "FindObjectOfType_24066", [type, includeInactive]));
    }
    static FindObjectsByType_type_sortMode(type, sortMode) {
      return window.ctx.call("UnityEngine.Object", "FindObjectsByType_24052", [type, sortMode]);
    }
    static FindObjectsByType_type_findObjectsInactive_sortMode(type, findObjectsInactive, sortMode) {
      return window.ctx.call("UnityEngine.Object", "FindObjectsByType_24053", [type, findObjectsInactive, sortMode]);
    }
    static FindObjectsByType(arg0) {
      return window.ctx.call("UnityEngine.Object", "FindObjectsByType", [arg0]);
    }
    static FindObjectsByType(arg0, arg1) {
      return window.ctx.call("UnityEngine.Object", "FindObjectsByType", [arg0, arg1]);
    }
    static FindObjectsOfType_type(type) {
      return window.ctx.call("UnityEngine.Object", "FindObjectsOfType_24050", [type]);
    }
    static FindObjectsOfType_type_includeInactive(type, includeInactive) {
      return window.ctx.call("UnityEngine.Object", "FindObjectsOfType_24051", [type, includeInactive]);
    }
    static FindObjectsOfType() {
      return window.ctx.call("UnityEngine.Object", "FindObjectsOfType", []);
    }
    static FindObjectsOfType(arg0) {
      return window.ctx.call("UnityEngine.Object", "FindObjectsOfType", [arg0]);
    }
    static FindObjectsOfTypeAll(arg0) {
      return window.ctx.call("UnityEngine.Object", "FindObjectsOfTypeAll", [arg0]);
    }
    static FindObjectsOfTypeIncludingAssets(arg0) {
      return window.ctx.call("UnityEngine.Object", "FindObjectsOfTypeIncludingAssets", [arg0]);
    }
    static FindSceneObjectsOfType(arg0) {
      return window.ctx.call("UnityEngine.Object", "FindSceneObjectsOfType", [arg0]);
    }
    static ForceLoadFromInstanceID(arg0) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "ForceLoadFromInstanceID", [arg0]));
    }
    static ForceLoadFromInstanceID_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "ForceLoadFromInstanceID_Injected", [out, arg0]);
        return out;
      })();
    }
    GetCachedPtr() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "GetCachedPtr", [out, this.ptr]);
        return out;
      })();
    }
    GetEntityId() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "GetEntityId", [out, this.ptr]);
        return out;
      })();
    }
    GetHashCode() {
      return window.ctx.call("UnityEngine.Object", "GetHashCode", [this.ptr]).val();
    }
    GetInstanceID() {
      return window.ctx.call("UnityEngine.Object", "GetInstanceID", [this.ptr]).val();
    }
    GetName() {
      return window.ctx.call("UnityEngine.Object", "GetName", [this.ptr]);
    }
    static GetName_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Object", "GetName_Injected", [arg0, arg1]);
    }
    static GetOffsetOfInstanceIDInCPlusPlusObject() {
      return window.ctx.call("UnityEngine.Object", "GetOffsetOfInstanceIDInCPlusPlusObject", []).val();
    }
    static GetPtrFromInstanceID(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "GetPtrFromInstanceID", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static GetPtrFromInstanceID_Injected(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "GetPtrFromInstanceID_Injected", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static Instantiate_original_position_rotation(original, position, rotation) {
      return new UnityObject(
        window.ctx.call("UnityEngine.Object", "Instantiate_24042", [original, position, rotation]),
      );
    }
    static Instantiate_original_position_rotation_parent(original, position, rotation, parent) {
      return new UnityObject(
        window.ctx.call("UnityEngine.Object", "Instantiate_24043", [original, position, rotation, parent]),
      );
    }
    static Instantiate_original(original) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "Instantiate_24044", [original]));
    }
    static Instantiate_original_scene(original, scene) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "Instantiate_24045", [original, scene]));
    }
    static Instantiate(arg0, arg1) {
      return window.ctx.call("UnityEngine.Object", "Instantiate", [arg0, arg1]);
    }
    static Instantiate(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.Object", "Instantiate", [arg0, arg1, arg2, arg3]);
    }
    static Instantiate_original_parent(original, parent) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "Instantiate_24046", [original, parent]));
    }
    static Instantiate_original_parent_instantiateInWorldSpace(original, parent, instantiateInWorldSpace) {
      return new UnityObject(
        window.ctx.call("UnityEngine.Object", "Instantiate_24047", [original, parent, instantiateInWorldSpace]),
      );
    }
    static Instantiate(arg0) {
      return window.ctx.call("UnityEngine.Object", "Instantiate", [arg0]);
    }
    static Instantiate(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Object", "Instantiate", [arg0, arg1, arg2]);
    }
    static Instantiate(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.Object", "Instantiate", [arg0, arg1, arg2, arg3]);
    }
    static Instantiate(arg0, arg1) {
      return window.ctx.call("UnityEngine.Object", "Instantiate", [arg0, arg1]);
    }
    static Instantiate(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Object", "Instantiate", [arg0, arg1, arg2]);
    }
    static InstantiateAsync(arg0) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0]);
    }
    static InstantiateAsync(arg0, arg1) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1]);
    }
    static InstantiateAsync(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3]);
    }
    static InstantiateAsync(arg0, arg1) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1]);
    }
    static InstantiateAsync(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3, arg4) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3, arg4]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3, arg4, arg5) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3, arg4) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3, arg4]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3, arg4, arg5) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    static InstantiateAsync(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3, arg4) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3, arg4]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3, arg4, arg5) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    static InstantiateAsync(arg0, arg1, arg2, arg3, arg4, arg5) {
      return window.ctx.call("UnityEngine.Object", "InstantiateAsync", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    static Internal_CloneSingle(arg0) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "Internal_CloneSingle", [arg0]));
    }
    static Internal_CloneSingleWithParams(arg0, arg1) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "Internal_CloneSingleWithParams", [arg0, arg1]));
    }
    static Internal_CloneSingleWithParams_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "Internal_CloneSingleWithParams_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    static Internal_CloneSingleWithParent(arg0, arg1, arg2) {
      return new UnityObject(
        window.ctx.call("UnityEngine.Object", "Internal_CloneSingleWithParent", [arg0, arg1, arg2]),
      );
    }
    static Internal_CloneSingleWithParent_Injected(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "Internal_CloneSingleWithParent_Injected", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static Internal_CloneSingleWithScene(arg0, arg1) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "Internal_CloneSingleWithScene", [arg0, arg1]));
    }
    static Internal_CloneSingleWithScene_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "Internal_CloneSingleWithScene_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    static Internal_CloneSingle_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "Internal_CloneSingle_Injected", [out, arg0]);
        return out;
      })();
    }
    static Internal_InstantiateAsyncWithParams(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "Internal_InstantiateAsyncWithParams", [
          out,
          arg0,
          arg1,
          arg2,
          arg3,
          arg4,
          arg5,
          arg6,
        ]);
        return out;
      })();
    }
    static Internal_InstantiateAsyncWithParams_Injected(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "Internal_InstantiateAsyncWithParams_Injected", [
          out,
          arg0,
          arg1,
          arg2,
          arg3,
          arg4,
          arg5,
          arg6,
        ]);
        return out;
      })();
    }
    static Internal_InstantiateSingle(arg0, arg1, arg2) {
      return new UnityObject(window.ctx.call("UnityEngine.Object", "Internal_InstantiateSingle", [arg0, arg1, arg2]));
    }
    static Internal_InstantiateSingleWithParams(arg0, arg1, arg2, arg3) {
      return new UnityObject(
        window.ctx.call("UnityEngine.Object", "Internal_InstantiateSingleWithParams", [arg0, arg1, arg2, arg3]),
      );
    }
    static Internal_InstantiateSingleWithParams_Injected(arg0, arg1, arg2, arg3) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "Internal_InstantiateSingleWithParams_Injected", [
          out,
          arg0,
          arg1,
          arg2,
          arg3,
        ]);
        return out;
      })();
    }
    static Internal_InstantiateSingleWithParent(arg0, arg1, arg2, arg3) {
      return new UnityObject(
        window.ctx.call("UnityEngine.Object", "Internal_InstantiateSingleWithParent", [arg0, arg1, arg2, arg3]),
      );
    }
    static Internal_InstantiateSingleWithParent_Injected(arg0, arg1, arg2, arg3) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "Internal_InstantiateSingleWithParent_Injected", [
          out,
          arg0,
          arg1,
          arg2,
          arg3,
        ]);
        return out;
      })();
    }
    static Internal_InstantiateSingle_Injected(arg0, arg1, arg2) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Object", "Internal_InstantiateSingle_Injected", [out, arg0, arg1, arg2]);
        return out;
      })();
    }
    static IsNativeObjectAlive(arg0) {
      return window.ctx.call("UnityEngine.Object", "IsNativeObjectAlive", [arg0]).val() === 1;
    }
    static IsPersistent(arg0) {
      return window.ctx.call("UnityEngine.Object", "IsPersistent", [arg0]).val() === 1;
    }
    static IsPersistent_Injected(arg0) {
      return window.ctx.call("UnityEngine.Object", "IsPersistent_Injected", [arg0]).val() === 1;
    }
    MarkDirty() {
      window.ctx.call("UnityEngine.Object", "MarkDirty", [this.ptr]);
    }
    static MarkDirty_Injected(arg0) {
      window.ctx.call("UnityEngine.Object", "MarkDirty_Injected", [arg0]);
    }
    SetName(arg0) {
      window.ctx.call("UnityEngine.Object", "SetName", [this.ptr, arg0]);
    }
    static SetName_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Object", "SetName_Injected", [arg0, arg1]);
    }
    ToString_pointer() {
      return window.ctx.call("UnityEngine.Object", "ToString_24069", [this.ptr]);
    }
    static ToString_obj(obj) {
      return window.ctx.call("UnityEngine.Object", "ToString_24080", [obj]);
    }
    static ToString_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Object", "ToString_Injected", [arg0, arg1]);
    }
    static get_hideFlags_Injected(arg0) {
      return new HideFlags(window.ctx.call("UnityEngine.Object", "get_hideFlags_Injected", [arg0]));
    }
    static set_hideFlags_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Object", "set_hideFlags_Injected", [arg0, arg1]);
    }
  }
  class AudioSourceRolloffMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class AudioSourceVelocityUpdateMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class EaseFunction {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    BeginInvoke(arg0, arg1, arg2, arg3, arg4, arg5) {
      return window.ctx.call("DG.Tweening.EaseFunction", "BeginInvoke", [this.ptr, arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    EndInvoke(arg0) {
      return window.ctx.call("DG.Tweening.EaseFunction", "EndInvoke", [this.ptr, arg0]).val();
    }
    Invoke(arg0, arg1, arg2, arg3) {
      return window.ctx.call("DG.Tweening.EaseFunction", "Invoke", [this.ptr, arg0, arg1, arg2, arg3]).val();
    }
  }
  class Ease {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class LoopType {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class TweenCallback {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    BeginInvoke(arg0, arg1) {
      return window.ctx.call("DG.Tweening.TweenCallback", "BeginInvoke", [this.ptr, arg0, arg1]);
    }
    EndInvoke(arg0) {
      window.ctx.call("DG.Tweening.TweenCallback", "EndInvoke", [this.ptr, arg0]);
    }
    Invoke() {
      window.ctx.call("DG.Tweening.TweenCallback", "Invoke", [this.ptr]);
    }
  }
  class Sequence {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get _sequencedObjs() {
      return this.ptr.readField(200, "i32");
    }
    set _sequencedObjs(value) {
      return this.ptr.writeField(200, "i32", value);
    }
    get lastTweenInsertTime() {
      return this.ptr.readField(204, "f32").val();
    }
    set lastTweenInsertTime(value) {
      return this.ptr.writeField(204, "f32", value);
    }
    get sequencedTweens() {
      return this.ptr.readField(196, "i32");
    }
    set sequencedTweens(value) {
      return this.ptr.writeField(196, "i32", value);
    }
    static ApplyInternalCycle(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      return (
        window.ctx
          .call("DG.Tweening.Sequence", "ApplyInternalCycle", [arg0, arg1, arg2, arg3, arg4, arg5, arg6])
          .val() === 1
      );
    }
    ApplyTween(arg0, arg1, arg2, arg3, arg4, arg5) {
      return (
        window.ctx.call("DG.Tweening.Sequence", "ApplyTween", [this.ptr, arg0, arg1, arg2, arg3, arg4, arg5]).val() ===
        1
      );
    }
    static DoAppendInterval(arg0, arg1) {
      return new Sequence(window.ctx.call("DG.Tweening.Sequence", "DoAppendInterval", [arg0, arg1]));
    }
    static DoApplyTween(arg0, arg1, arg2, arg3, arg4, arg5) {
      return window.ctx.call("DG.Tweening.Sequence", "DoApplyTween", [arg0, arg1, arg2, arg3, arg4, arg5]).val() === 1;
    }
    static DoInsert(arg0, arg1, arg2) {
      return new Sequence(window.ctx.call("DG.Tweening.Sequence", "DoInsert", [arg0, arg1, arg2]));
    }
    static DoInsertCallback(arg0, arg1, arg2) {
      return new Sequence(window.ctx.call("DG.Tweening.Sequence", "DoInsertCallback", [arg0, arg1, arg2]));
    }
    static DoPrepend(arg0, arg1) {
      return new Sequence(window.ctx.call("DG.Tweening.Sequence", "DoPrepend", [arg0, arg1]));
    }
    static DoPrependInterval(arg0, arg1) {
      return new Sequence(window.ctx.call("DG.Tweening.Sequence", "DoPrependInterval", [arg0, arg1]));
    }
    static DoStartup(arg0) {
      return window.ctx.call("DG.Tweening.Sequence", "DoStartup", [arg0]).val() === 1;
    }
    static IsAnyCallbackSet(arg0) {
      return window.ctx.call("DG.Tweening.Sequence", "IsAnyCallbackSet", [arg0]).val() === 1;
    }
    Reset() {
      window.ctx.call("DG.Tweening.Sequence", "Reset", [this.ptr]);
    }
    static Setup(arg0) {
      window.ctx.call("DG.Tweening.Sequence", "Setup", [arg0]);
    }
    static StableSortSequencedObjs(arg0) {
      window.ctx.call("DG.Tweening.Sequence", "StableSortSequencedObjs", [arg0]);
    }
    Startup() {
      return window.ctx.call("DG.Tweening.Sequence", "Startup", [this.ptr]).val() === 1;
    }
    UpdateDelay(arg0) {
      return window.ctx.call("DG.Tweening.Sequence", "UpdateDelay", [this.ptr, arg0]).val();
    }
    Validate() {
      return window.ctx.call("DG.Tweening.Sequence", "Validate", [this.ptr]).val() === 1;
    }
  }
  class SpecialStartupMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class FieldTypeInfo {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get ChildPrimitiveType() {
      return this.ptr.readField(8, "i32").mstr();
    }
    set ChildPrimitiveType(value) {
      return this.ptr.writeField(8, "i32", window.ctx.createMstr(value));
    }
    get ChildType() {
      return new FieldTypeInfo(this.ptr.readField(12, "i32"));
    }
    set ChildType(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get FieldType() {
      return this.ptr.readField(16, "i32").mstr();
    }
    set FieldType(value) {
      return this.ptr.writeField(16, "i32", window.ctx.createMstr(value));
    }
    get Index() {
      return this.ptr.readField(20, "i32").val();
    }
    set Index(value) {
      return this.ptr.writeField(20, "i32", value);
    }
  }
  class UpdateType {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class Texture2D {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get activeMipmapLimit() {
      return window.ctx.call("UnityEngine.Texture2D", "get_activeMipmapLimit", [this.ptr]).val();
    }
    static get blackTexture() {
      return new Texture2D(window.ctx.call("UnityEngine.Texture2D", "get_blackTexture", []));
    }
    get calculatedMipmapLevel() {
      return window.ctx.call("UnityEngine.Texture2D", "get_calculatedMipmapLevel", [this.ptr]).val();
    }
    get desiredMipmapLevel() {
      return window.ctx.call("UnityEngine.Texture2D", "get_desiredMipmapLevel", [this.ptr]).val();
    }
    get format() {
      return new TextureFormat(window.ctx.call("UnityEngine.Texture2D", "get_format", [this.ptr]));
    }
    static get grayTexture() {
      return new Texture2D(window.ctx.call("UnityEngine.Texture2D", "get_grayTexture", []));
    }
    get ignoreMipmapLimit() {
      return window.ctx.call("UnityEngine.Texture2D", "get_ignoreMipmapLimit", [this.ptr]).val() === 1;
    }
    set ignoreMipmapLimit(value) {
      window.ctx.call("UnityEngine.Texture2D", "set_ignoreMipmapLimit", [this.ptr, value]);
    }
    get isPreProcessed() {
      return window.ctx.call("UnityEngine.Texture2D", "get_isPreProcessed", [this.ptr]).val() === 1;
    }
    get isReadable() {
      return window.ctx.call("UnityEngine.Texture2D", "get_isReadable", [this.ptr]).val() === 1;
    }
    static get linearGrayTexture() {
      return new Texture2D(window.ctx.call("UnityEngine.Texture2D", "get_linearGrayTexture", []));
    }
    get loadAllMips() {
      return window.ctx.call("UnityEngine.Texture2D", "get_loadAllMips", [this.ptr]).val() === 1;
    }
    set loadAllMips(value) {
      window.ctx.call("UnityEngine.Texture2D", "set_loadAllMips", [this.ptr, value]);
    }
    get loadedMipmapLevel() {
      return window.ctx.call("UnityEngine.Texture2D", "get_loadedMipmapLevel", [this.ptr]).val();
    }
    get loadingMipmapLevel() {
      return window.ctx.call("UnityEngine.Texture2D", "get_loadingMipmapLevel", [this.ptr]).val();
    }
    get minimumMipmapLevel() {
      return window.ctx.call("UnityEngine.Texture2D", "get_minimumMipmapLevel", [this.ptr]).val();
    }
    set minimumMipmapLevel(value) {
      window.ctx.call("UnityEngine.Texture2D", "set_minimumMipmapLevel", [this.ptr, value]);
    }
    get mipmapLimitGroup() {
      return window.ctx.call("UnityEngine.Texture2D", "get_mipmapLimitGroup", [this.ptr]);
    }
    static get normalTexture() {
      return new Texture2D(window.ctx.call("UnityEngine.Texture2D", "get_normalTexture", []));
    }
    static get redTexture() {
      return new Texture2D(window.ctx.call("UnityEngine.Texture2D", "get_redTexture", []));
    }
    get requestedMipmapLevel() {
      return window.ctx.call("UnityEngine.Texture2D", "get_requestedMipmapLevel", [this.ptr]).val();
    }
    set requestedMipmapLevel(value) {
      window.ctx.call("UnityEngine.Texture2D", "set_requestedMipmapLevel", [this.ptr, value]);
    }
    get streamingMipmaps() {
      return window.ctx.call("UnityEngine.Texture2D", "get_streamingMipmaps", [this.ptr]).val() === 1;
    }
    get streamingMipmapsPriority() {
      return window.ctx.call("UnityEngine.Texture2D", "get_streamingMipmapsPriority", [this.ptr]).val();
    }
    get vtOnly() {
      return window.ctx.call("UnityEngine.Texture2D", "get_vtOnly", [this.ptr]).val() === 1;
    }
    static get whiteTexture() {
      return new Texture2D(window.ctx.call("UnityEngine.Texture2D", "get_whiteTexture", []));
    }
    Apply_updateMipmaps_makeNoLongerReadable(updateMipmaps, makeNoLongerReadable) {
      window.ctx.call("UnityEngine.Texture2D", "Apply_2992", [this.ptr, updateMipmaps, makeNoLongerReadable]);
    }
    Apply_updateMipmaps(updateMipmaps) {
      window.ctx.call("UnityEngine.Texture2D", "Apply_22736", [this.ptr, updateMipmaps]);
    }
    Apply_pointer() {
      window.ctx.call("UnityEngine.Texture2D", "Apply_22737", [this.ptr]);
    }
    ApplyImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture2D", "ApplyImpl", [this.ptr, arg0, arg1]);
    }
    static ApplyImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Texture2D", "ApplyImpl_Injected", [arg0, arg1, arg2]);
    }
    ClearMinimumMipmapLevel() {
      window.ctx.call("UnityEngine.Texture2D", "ClearMinimumMipmapLevel", [this.ptr]);
    }
    static ClearMinimumMipmapLevel_Injected(arg0) {
      window.ctx.call("UnityEngine.Texture2D", "ClearMinimumMipmapLevel_Injected", [arg0]);
    }
    ClearRequestedMipmapLevel() {
      window.ctx.call("UnityEngine.Texture2D", "ClearRequestedMipmapLevel", [this.ptr]);
    }
    static ClearRequestedMipmapLevel_Injected(arg0) {
      window.ctx.call("UnityEngine.Texture2D", "ClearRequestedMipmapLevel_Injected", [arg0]);
    }
    Compress(arg0) {
      window.ctx.call("UnityEngine.Texture2D", "Compress", [this.ptr, arg0]);
    }
    static Compress_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture2D", "Compress_Injected", [arg0, arg1]);
    }
    CopyPixels_src(src) {
      window.ctx.call("UnityEngine.Texture2D", "CopyPixels_22751", [this.ptr, src]);
    }
    CopyPixels_src_srcElement_srcMip_dstMip(src, srcElement, srcMip, dstMip) {
      window.ctx.call("UnityEngine.Texture2D", "CopyPixels_22752", [this.ptr, src, srcElement, srcMip, dstMip]);
    }
    CopyPixels_src_srcElement_srcMip_srcX_srcY_srcWidth_srcHeight_dstMip_dstX_dstY(
      src,
      srcElement,
      srcMip,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      dstMip,
      dstX,
      dstY,
    ) {
      window.ctx.call("UnityEngine.Texture2D", "CopyPixels_22753", [
        this.ptr,
        src,
        srcElement,
        srcMip,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        dstMip,
        dstX,
        dstY,
      ]);
    }
    CopyPixels_Full(arg0) {
      window.ctx.call("UnityEngine.Texture2D", "CopyPixels_Full", [this.ptr, arg0]);
    }
    static CopyPixels_Full_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture2D", "CopyPixels_Full_Injected", [arg0, arg1]);
    }
    CopyPixels_Region(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
      window.ctx.call("UnityEngine.Texture2D", "CopyPixels_Region", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
        arg8,
        arg9,
      ]);
    }
    static CopyPixels_Region_Injected(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
      window.ctx.call("UnityEngine.Texture2D", "CopyPixels_Region_Injected", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
        arg8,
        arg9,
        arg10,
      ]);
    }
    CopyPixels_Slice(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Texture2D", "CopyPixels_Slice", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    static CopyPixels_Slice_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Texture2D", "CopyPixels_Slice_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    static CreateExternalTexture(arg0, arg1, arg2, arg3, arg4, arg5) {
      return new Texture2D(
        window.ctx.call("UnityEngine.Texture2D", "CreateExternalTexture", [arg0, arg1, arg2, arg3, arg4, arg5]),
      );
    }
    static GenerateAtlas(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.Texture2D", "GenerateAtlas", [arg0, arg1, arg2, arg3]).val() === 1;
    }
    static GenerateAtlasImpl(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Texture2D", "GenerateAtlasImpl", [arg0, arg1, arg2, arg3]);
    }
    static GenerateAtlasImpl_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Texture2D", "GenerateAtlasImpl_Injected", [arg0, arg1, arg2, arg3]);
    }
    GetImageDataSize() {
      return window.ctx.call("UnityEngine.Texture2D", "GetImageDataSize", [this.ptr]).val();
    }
    static GetImageDataSize_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "GetImageDataSize_Injected", [arg0]).val();
    }
    GetPixel_x_y(x, y) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Texture2D", "GetPixel_22731", [out, this.ptr, x, y]);
        return out;
      })();
    }
    GetPixel_x_y_mipLevel(x, y, mipLevel) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Texture2D", "GetPixel_22732", [out, this.ptr, x, y, mipLevel]);
        return out;
      })();
    }
    GetPixelBilinear_u_v(u, v) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Texture2D", "GetPixelBilinear_1744", [out, this.ptr, u, v]);
        return out;
      })();
    }
    GetPixelBilinear_u_v_mipLevel(u, v, mipLevel) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Texture2D", "GetPixelBilinear_22733", [out, this.ptr, u, v, mipLevel]);
        return out;
      })();
    }
    GetPixelBilinearImpl(arg0, arg1, arg2, arg3) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Texture2D", "GetPixelBilinearImpl", [out, this.ptr, arg0, arg1, arg2, arg3]);
        return out;
      })();
    }
    static GetPixelBilinearImpl_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.Texture2D", "GetPixelBilinearImpl_Injected", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    GetPixelData(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Texture2D", "GetPixelData", [out, this.ptr, arg0]);
        return out;
      })();
    }
    GetPixelImpl(arg0, arg1, arg2, arg3) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Texture2D", "GetPixelImpl", [out, this.ptr, arg0, arg1, arg2, arg3]);
        return out;
      })();
    }
    static GetPixelImpl_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.Texture2D", "GetPixelImpl_Injected", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    GetPixels_x_y_blockWidth_blockHeight_miplevel(x, y, blockWidth, blockHeight, miplevel) {
      return window.ctx.call("UnityEngine.Texture2D", "GetPixels_22697", [
        this.ptr,
        x,
        y,
        blockWidth,
        blockHeight,
        miplevel,
      ]);
    }
    GetPixels_x_y_blockWidth_blockHeight(x, y, blockWidth, blockHeight) {
      return window.ctx.call("UnityEngine.Texture2D", "GetPixels_22698", [this.ptr, x, y, blockWidth, blockHeight]);
    }
    GetPixels_miplevel(miplevel) {
      return window.ctx.call("UnityEngine.Texture2D", "GetPixels_22750", [this.ptr, miplevel]);
    }
    GetPixels_pointer() {
      return window.ctx.call("UnityEngine.Texture2D", "GetPixels_2990", [this.ptr]);
    }
    GetPixels32_miplevel(miplevel) {
      return window.ctx.call("UnityEngine.Texture2D", "GetPixels32_22699", [this.ptr, miplevel]);
    }
    GetPixels32_pointer() {
      return window.ctx.call("UnityEngine.Texture2D", "GetPixels32_22700", [this.ptr]);
    }
    static GetPixels32_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Texture2D", "GetPixels32_Injected", [arg0, arg1]);
    }
    static GetPixels_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      return window.ctx.call("UnityEngine.Texture2D", "GetPixels_Injected", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    GetRawTextureData_pointer() {
      return window.ctx.call("UnityEngine.Texture2D", "GetRawTextureData_22696", [this.ptr]);
    }
    GetRawTextureData() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Texture2D", "GetRawTextureData", [out, this.ptr]);
        return out;
      })();
    }
    static GetRawTextureData_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "GetRawTextureData_Injected", [arg0]);
    }
    GetWritableImageData(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Texture2D", "GetWritableImageData", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetWritableImageData_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Texture2D", "GetWritableImageData_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    IgnoreMipmapLimit() {
      return window.ctx.call("UnityEngine.Texture2D", "IgnoreMipmapLimit", [this.ptr]).val() === 1;
    }
    static IgnoreMipmapLimit_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "IgnoreMipmapLimit_Injected", [arg0]).val() === 1;
    }
    static Internal_Create(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
      window.ctx.call("UnityEngine.Texture2D", "Internal_Create", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
        arg8,
        arg9,
      ]);
    }
    static Internal_CreateEmptyImpl(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "Internal_CreateEmptyImpl", [arg0]).val() === 1;
    }
    static Internal_CreateImpl(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "Internal_CreateImpl", [
            arg0,
            arg1,
            arg2,
            arg3,
            arg4,
            arg5,
            arg6,
            arg7,
            arg8,
            arg9,
          ])
          .val() === 1
      );
    }
    static Internal_CreateImpl_Injected(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "Internal_CreateImpl_Injected", [
            arg0,
            arg1,
            arg2,
            arg3,
            arg4,
            arg5,
            arg6,
            arg7,
            arg8,
            arg9,
          ])
          .val() === 1
      );
    }
    IsRequestedMipmapLevelLoaded() {
      return window.ctx.call("UnityEngine.Texture2D", "IsRequestedMipmapLevelLoaded", [this.ptr]).val() === 1;
    }
    static IsRequestedMipmapLevelLoaded_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "IsRequestedMipmapLevelLoaded_Injected", [arg0]).val() === 1;
    }
    LoadRawTextureData_data_size(data, size) {
      window.ctx.call("UnityEngine.Texture2D", "LoadRawTextureData_22734", [this.ptr, data, size]);
    }
    LoadRawTextureData_data(data) {
      window.ctx.call("UnityEngine.Texture2D", "LoadRawTextureData_22735", [this.ptr, data]);
    }
    LoadRawTextureData(arg0) {
      window.ctx.call("UnityEngine.Texture2D", "LoadRawTextureData", [this.ptr, arg0]);
    }
    LoadRawTextureDataImpl(arg0, arg1) {
      return window.ctx.call("UnityEngine.Texture2D", "LoadRawTextureDataImpl", [this.ptr, arg0, arg1]).val() === 1;
    }
    LoadRawTextureDataImplArray(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "LoadRawTextureDataImplArray", [this.ptr, arg0]).val() === 1;
    }
    static LoadRawTextureDataImplArray_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Texture2D", "LoadRawTextureDataImplArray_Injected", [arg0, arg1]).val() === 1;
    }
    static LoadRawTextureDataImpl_Injected(arg0, arg1, arg2) {
      return (
        window.ctx.call("UnityEngine.Texture2D", "LoadRawTextureDataImpl_Injected", [arg0, arg1, arg2]).val() === 1
      );
    }
    PackTextures_textures_padding_maximumAtlasSize_makeNoLongerReadable(
      textures,
      padding,
      maximumAtlasSize,
      makeNoLongerReadable,
    ) {
      return window.ctx.call("UnityEngine.Texture2D", "PackTextures_22701", [
        this.ptr,
        textures,
        padding,
        maximumAtlasSize,
        makeNoLongerReadable,
      ]);
    }
    PackTextures_textures_padding_maximumAtlasSize(textures, padding, maximumAtlasSize) {
      return window.ctx.call("UnityEngine.Texture2D", "PackTextures_22702", [
        this.ptr,
        textures,
        padding,
        maximumAtlasSize,
      ]);
    }
    PackTextures_textures_padding(textures, padding) {
      return window.ctx.call("UnityEngine.Texture2D", "PackTextures_22703", [this.ptr, textures, padding]);
    }
    static PackTextures_Injected(arg0, arg1, arg2, arg3, arg4) {
      return window.ctx.call("UnityEngine.Texture2D", "PackTextures_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    ReadPixels_source_destX_destY_recalculateMipMaps(source, destX, destY, recalculateMipMaps) {
      window.ctx.call("UnityEngine.Texture2D", "ReadPixels_22743", [
        this.ptr,
        source,
        destX,
        destY,
        recalculateMipMaps,
      ]);
    }
    ReadPixels_source_destX_destY(source, destX, destY) {
      window.ctx.call("UnityEngine.Texture2D", "ReadPixels_22744", [this.ptr, source, destX, destY]);
    }
    ReadPixelsImpl(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Texture2D", "ReadPixelsImpl", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    static ReadPixelsImpl_Injected(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Texture2D", "ReadPixelsImpl_Injected", [arg0, arg1, arg2, arg3, arg4]);
    }
    Reinitialize_width_height(width, height) {
      return window.ctx.call("UnityEngine.Texture2D", "Reinitialize_1624", [this.ptr, width, height]).val() === 1;
    }
    Reinitialize_width_height_format_hasMipMap(width, height, format, hasMipMap) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "Reinitialize_22738", [this.ptr, width, height, format, hasMipMap])
          .val() === 1
      );
    }
    Reinitialize_width_height_format_hasMipMap(width, height, format, hasMipMap) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "Reinitialize_22739", [this.ptr, width, height, format, hasMipMap])
          .val() === 1
      );
    }
    ReinitializeImpl(arg0, arg1) {
      return window.ctx.call("UnityEngine.Texture2D", "ReinitializeImpl", [this.ptr, arg0, arg1]).val() === 1;
    }
    static ReinitializeImpl_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Texture2D", "ReinitializeImpl_Injected", [arg0, arg1, arg2]).val() === 1;
    }
    ReinitializeWithFormatImpl(arg0, arg1, arg2, arg3) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "ReinitializeWithFormatImpl", [this.ptr, arg0, arg1, arg2, arg3])
          .val() === 1
      );
    }
    static ReinitializeWithFormatImpl_Injected(arg0, arg1, arg2, arg3, arg4) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "ReinitializeWithFormatImpl_Injected", [arg0, arg1, arg2, arg3, arg4])
          .val() === 1
      );
    }
    ReinitializeWithTextureFormatImpl(arg0, arg1, arg2, arg3) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "ReinitializeWithTextureFormatImpl", [this.ptr, arg0, arg1, arg2, arg3])
          .val() === 1
      );
    }
    static ReinitializeWithTextureFormatImpl_Injected(arg0, arg1, arg2, arg3, arg4) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "ReinitializeWithTextureFormatImpl_Injected", [arg0, arg1, arg2, arg3, arg4])
          .val() === 1
      );
    }
    Resize_width_height(width, height) {
      return window.ctx.call("UnityEngine.Texture2D", "Resize_22740", [this.ptr, width, height]).val() === 1;
    }
    Resize_width_height_format_hasMipMap(width, height, format, hasMipMap) {
      return (
        window.ctx.call("UnityEngine.Texture2D", "Resize_22741", [this.ptr, width, height, format, hasMipMap]).val() ===
        1
      );
    }
    Resize_width_height_format_hasMipMap(width, height, format, hasMipMap) {
      return (
        window.ctx.call("UnityEngine.Texture2D", "Resize_22742", [this.ptr, width, height, format, hasMipMap]).val() ===
        1
      );
    }
    SetAllPixels32(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture2D", "SetAllPixels32", [this.ptr, arg0, arg1]);
    }
    static SetAllPixels32_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Texture2D", "SetAllPixels32_Injected", [arg0, arg1, arg2]);
    }
    SetBlockOfPixels32(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.Texture2D", "SetBlockOfPixels32", [this.ptr, arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    static SetBlockOfPixels32_Injected(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      window.ctx.call("UnityEngine.Texture2D", "SetBlockOfPixels32_Injected", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
      ]);
    }
    SetIgnoreMipmapLimitAndReload(arg0) {
      window.ctx.call("UnityEngine.Texture2D", "SetIgnoreMipmapLimitAndReload", [this.ptr, arg0]);
    }
    static SetIgnoreMipmapLimitAndReload_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture2D", "SetIgnoreMipmapLimitAndReload_Injected", [arg0, arg1]);
    }
    SetPixel_x_y_color(x, y, color) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixel_22726", [this.ptr, x, y, color]);
    }
    SetPixel_x_y_color_mipLevel(x, y, color, mipLevel) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixel_22727", [this.ptr, x, y, color, mipLevel]);
    }
    SetPixelData(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixelData", [this.ptr, arg0, arg1, arg2]);
    }
    SetPixelData(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixelData", [this.ptr, arg0, arg1, arg2]);
    }
    SetPixelDataImpl(arg0, arg1, arg2, arg3, arg4) {
      return (
        window.ctx.call("UnityEngine.Texture2D", "SetPixelDataImpl", [this.ptr, arg0, arg1, arg2, arg3, arg4]).val() ===
        1
      );
    }
    SetPixelDataImplArray(arg0, arg1, arg2, arg3, arg4) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "SetPixelDataImplArray", [this.ptr, arg0, arg1, arg2, arg3, arg4])
          .val() === 1
      );
    }
    static SetPixelDataImplArray_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "SetPixelDataImplArray_Injected", [arg0, arg1, arg2, arg3, arg4, arg5])
          .val() === 1
      );
    }
    static SetPixelDataImpl_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      return (
        window.ctx
          .call("UnityEngine.Texture2D", "SetPixelDataImpl_Injected", [arg0, arg1, arg2, arg3, arg4, arg5])
          .val() === 1
      );
    }
    SetPixelImpl(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixelImpl", [this.ptr, arg0, arg1, arg2, arg3, arg4]);
    }
    static SetPixelImpl_Injected(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixelImpl_Injected", [arg0, arg1, arg2, arg3, arg4, arg5]);
    }
    SetPixels_x_y_blockWidth_blockHeight_colors_miplevel(x, y, blockWidth, blockHeight, colors, miplevel) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixels_22728", [
        this.ptr,
        x,
        y,
        blockWidth,
        blockHeight,
        colors,
        miplevel,
      ]);
    }
    SetPixels_x_y_blockWidth_blockHeight_colors(x, y, blockWidth, blockHeight, colors) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixels_22729", [this.ptr, x, y, blockWidth, blockHeight, colors]);
    }
    SetPixels_colors_miplevel(colors, miplevel) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixels_22730", [this.ptr, colors, miplevel]);
    }
    SetPixels_colors(colors) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixels_2991", [this.ptr, colors]);
    }
    SetPixels32_colors_miplevel(colors, miplevel) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixels32_22746", [this.ptr, colors, miplevel]);
    }
    SetPixels32_colors(colors) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixels32_22747", [this.ptr, colors]);
    }
    SetPixels32_x_y_blockWidth_blockHeight_colors_miplevel(x, y, blockWidth, blockHeight, colors, miplevel) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixels32_22748", [
        this.ptr,
        x,
        y,
        blockWidth,
        blockHeight,
        colors,
        miplevel,
      ]);
    }
    SetPixels32_x_y_blockWidth_blockHeight_colors(x, y, blockWidth, blockHeight, colors) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixels32_22749", [this.ptr, x, y, blockWidth, blockHeight, colors]);
    }
    SetPixelsImpl(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixelsImpl", [this.ptr, arg0, arg1, arg2, arg3, arg4, arg5, arg6]);
    }
    static SetPixelsImpl_Injected(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
      window.ctx.call("UnityEngine.Texture2D", "SetPixelsImpl_Injected", [
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
        arg6,
        arg7,
      ]);
    }
    UpdateExternalTexture(arg0) {
      window.ctx.call("UnityEngine.Texture2D", "UpdateExternalTexture", [this.ptr, arg0]);
    }
    static UpdateExternalTexture_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture2D", "UpdateExternalTexture_Injected", [arg0, arg1]);
    }
    ValidateFormat_format_width_height(format, width, height) {
      return (
        window.ctx.call("UnityEngine.Texture2D", "ValidateFormat_22707", [this.ptr, format, width, height]).val() === 1
      );
    }
    ValidateFormat_format_width_height(format, width, height) {
      return (
        window.ctx.call("UnityEngine.Texture2D", "ValidateFormat_22708", [this.ptr, format, width, height]).val() === 1
      );
    }
    static get_activeMipmapLimit_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_activeMipmapLimit_Injected", [arg0]).val();
    }
    static get_blackTexture_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Texture2D", "get_blackTexture_Injected", [out]);
        return out;
      })();
    }
    static get_calculatedMipmapLevel_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_calculatedMipmapLevel_Injected", [arg0]).val();
    }
    static get_desiredMipmapLevel_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_desiredMipmapLevel_Injected", [arg0]).val();
    }
    static get_format_Injected(arg0) {
      return new TextureFormat(window.ctx.call("UnityEngine.Texture2D", "get_format_Injected", [arg0]));
    }
    static get_grayTexture_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Texture2D", "get_grayTexture_Injected", [out]);
        return out;
      })();
    }
    static get_isPreProcessed_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_isPreProcessed_Injected", [arg0]).val() === 1;
    }
    static get_isReadable_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_isReadable_Injected", [arg0]).val() === 1;
    }
    static get_linearGrayTexture_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Texture2D", "get_linearGrayTexture_Injected", [out]);
        return out;
      })();
    }
    static get_loadAllMips_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_loadAllMips_Injected", [arg0]).val() === 1;
    }
    static get_loadedMipmapLevel_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_loadedMipmapLevel_Injected", [arg0]).val();
    }
    static get_loadingMipmapLevel_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_loadingMipmapLevel_Injected", [arg0]).val();
    }
    static get_minimumMipmapLevel_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_minimumMipmapLevel_Injected", [arg0]).val();
    }
    static get_mipmapLimitGroup_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture2D", "get_mipmapLimitGroup_Injected", [arg0, arg1]);
    }
    static get_normalTexture_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Texture2D", "get_normalTexture_Injected", [out]);
        return out;
      })();
    }
    static get_redTexture_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Texture2D", "get_redTexture_Injected", [out]);
        return out;
      })();
    }
    static get_requestedMipmapLevel_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_requestedMipmapLevel_Injected", [arg0]).val();
    }
    static get_streamingMipmapsPriority_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_streamingMipmapsPriority_Injected", [arg0]).val();
    }
    static get_streamingMipmaps_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_streamingMipmaps_Injected", [arg0]).val() === 1;
    }
    static get_vtOnly_Injected(arg0) {
      return window.ctx.call("UnityEngine.Texture2D", "get_vtOnly_Injected", [arg0]).val() === 1;
    }
    static get_whiteTexture_Injected() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Texture2D", "get_whiteTexture_Injected", [out]);
        return out;
      })();
    }
    static set_loadAllMips_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture2D", "set_loadAllMips_Injected", [arg0, arg1]);
    }
    static set_minimumMipmapLevel_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture2D", "set_minimumMipmapLevel_Injected", [arg0, arg1]);
    }
    static set_requestedMipmapLevel_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Texture2D", "set_requestedMipmapLevel_Injected", [arg0, arg1]);
    }
  }
  class SpritePackingMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class SpritePackingRotation {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class PlayerEndResults {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get eloAfter() {
      return this.ptr.readField(20, "i32").val();
    }
    set eloAfter(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get eloBefore() {
      return this.ptr.readField(16, "i32").val();
    }
    set eloBefore(value) {
      return this.ptr.writeField(16, "i32", value);
    }
  }
  class PlayerLastGotShot {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get byId() {
      return this.ptr.readField(16, "i32").mstr();
    }
    set byId(value) {
      return this.ptr.writeField(16, "i32", window.ctx.createMstr(value));
    }
    get gunId() {
      return this.ptr.readField(20, "i32");
    }
    set gunId(value) {
      return this.ptr.writeField(20, "i32", value);
    }
  }
  class PlayerRigidState {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get air() {
      return this.ptr.readField(24, "i32").val() === 1;
    }
    set air(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get neck() {
      return this.ptr.readField(25, "i32");
    }
    set neck(value) {
      return this.ptr.writeField(25, "i32", value);
    }
    get position() {
      return new SchemaVector3(this.ptr.readField(16, "i32"));
    }
    set position(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get yaw() {
      return this.ptr.readField(20, "f32").val();
    }
    set yaw(value) {
      return this.ptr.writeField(20, "f32", value);
    }
  }
  class PlayerUser {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get createdAt() {
      return this.ptr.readField(24, "i32").mstr();
    }
    set createdAt(value) {
      return this.ptr.writeField(24, "i32", window.ctx.createMstr(value));
    }
    get pfp() {
      return this.ptr.readField(20, "i32").mstr();
    }
    set pfp(value) {
      return this.ptr.writeField(20, "i32", window.ctx.createMstr(value));
    }
    get username() {
      return this.ptr.readField(16, "i32").mstr();
    }
    set username(value) {
      return this.ptr.writeField(16, "i32", window.ctx.createMstr(value));
    }
    get xp() {
      return this.ptr.readField(28, "i32");
    }
    set xp(value) {
      return this.ptr.writeField(28, "i32", value);
    }
  }
  class ShakePresetShakeType {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class SchemaVector3 {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get x() {
      return this.ptr.readField(16, "f32").val();
    }
    set x(value) {
      return this.ptr.writeField(16, "f32", value);
    }
    get y() {
      return this.ptr.readField(20, "f32").val();
    }
    set y(value) {
      return this.ptr.writeField(20, "f32", value);
    }
    get z() {
      return this.ptr.readField(24, "f32").val();
    }
    set z(value) {
      return this.ptr.writeField(24, "f32", value);
    }
  }
  class FlagState {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get basePosition() {
      return new SchemaVector3(this.ptr.readField(28, "i32"));
    }
    set basePosition(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get carriedBy() {
      return this.ptr.readField(20, "i32").mstr();
    }
    set carriedBy(value) {
      return this.ptr.writeField(20, "i32", window.ctx.createMstr(value));
    }
    get isAtBase() {
      return this.ptr.readField(17, "i32").val() === 1;
    }
    set isAtBase(value) {
      return this.ptr.writeField(17, "i32", value);
    }
    get position() {
      return new SchemaVector3(this.ptr.readField(24, "i32"));
    }
    set position(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get teamId() {
      return this.ptr.readField(16, "i32");
    }
    set teamId(value) {
      return this.ptr.writeField(16, "i32", value);
    }
  }
  class TeamInfo {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get color() {
      return new Color(this.ptr.readField(12, "i32"));
    }
    set color(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get name() {
      return this.ptr.readField(8, "i32").mstr();
    }
    set name(value) {
      return this.ptr.writeField(8, "i32", window.ctx.createMstr(value));
    }
  }
  class ColyTransform {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get OnAirState() {
      return this.ptr.readField(80, "i32").val() === 1;
    }
    set OnAirState(value) {
      return this.ptr.writeField(80, "i32", value);
    }
    get firstStateReceived() {
      return this.ptr.readField(104, "i32").val() === 1;
    }
    set firstStateReceived(value) {
      return this.ptr.writeField(104, "i32", value);
    }
    get inAir() {
      return this.ptr.readField(77, "i32").val() === 1;
    }
    set inAir(value) {
      return this.ptr.writeField(77, "i32", value);
    }
    get interpolationDelay() {
      return this.ptr.readField(28, "f32").val();
    }
    set interpolationDelay(value) {
      return this.ptr.writeField(28, "f32", value);
    }
    get lastReceivedState() {
      return this.ptr.readField(88, "i32");
    }
    set lastReceivedState(value) {
      return this.ptr.writeField(88, "i32", value);
    }
    get lastSentNeck() {
      return this.ptr.readField(64, "f32").val();
    }
    set lastSentNeck(value) {
      return this.ptr.writeField(64, "f32", value);
    }
    get lastSentPosition() {
      return new Vector3(this.ptr.readField(36, "i32"));
    }
    set lastSentPosition(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get lastSentRotation() {
      return new Quaternion(this.ptr.readField(48, "i32"));
    }
    set lastSentRotation(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    get lastServerTime() {
      return this.ptr.readField(96, "i32");
    }
    set lastServerTime(value) {
      return this.ptr.writeField(96, "i32", value);
    }
    get lastTeleportPosition() {
      return new Vector3(this.ptr.readField(0, "i32"));
    }
    set lastTeleportPosition(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get movementCooldown() {
      return this.ptr.readField(20, "f32").val();
    }
    set movementCooldown(value) {
      return this.ptr.writeField(20, "f32", value);
    }
    get neckController() {
      return new NeckController(this.ptr.readField(32, "i32"));
    }
    set neckController(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get positionBufferSize() {
      return this.ptr.readField(24, "i32").val();
    }
    set positionBufferSize(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get stateBuffer() {
      return this.ptr.readField(84, "i32");
    }
    set stateBuffer(value) {
      return this.ptr.writeField(84, "i32", value);
    }
    get targetState() {
      return this.ptr.readField(92, "i32");
    }
    set targetState(value) {
      return this.ptr.writeField(92, "i32", value);
    }
    get teleportApplyCoroutine() {
      return new Coroutine(this.ptr.readField(116, "i32"));
    }
    set teleportApplyCoroutine(value) {
      return this.ptr.writeField(116, "i32", value);
    }
    get timeSinceLastMovement() {
      return this.ptr.readField(72, "f32").val();
    }
    set timeSinceLastMovement(value) {
      return this.ptr.writeField(72, "f32", value);
    }
    get timeSinceLastSend() {
      return this.ptr.readField(68, "f32").val();
    }
    set timeSinceLastSend(value) {
      return this.ptr.writeField(68, "f32", value);
    }
    get unregisterRigidChange() {
      return new Action(this.ptr.readField(108, "i32"));
    }
    set unregisterRigidChange(value) {
      return this.ptr.writeField(108, "i32", value);
    }
    get unregisterTeleportChange() {
      return new Action(this.ptr.readField(112, "i32"));
    }
    set unregisterTeleportChange(value) {
      return this.ptr.writeField(112, "i32", value);
    }
    get wasMoving() {
      return this.ptr.readField(76, "i32").val() === 1;
    }
    set wasMoving(value) {
      return this.ptr.writeField(76, "i32", value);
    }
    ApplyTeleportNow(arg0, arg1) {
      window.ctx.call("ColyTransform", "ApplyTeleportNow", [this.ptr, arg0, arg1]);
    }
    ApplyTeleportOverNextFrames(arg0, arg1, arg2) {
      return new IEnumerator(
        window.ctx.call("ColyTransform", "ApplyTeleportOverNextFrames", [this.ptr, arg0, arg1, arg2]),
      );
    }
    InitializeListeners() {
      window.ctx.call("ColyTransform", "InitializeListeners", [this.ptr]);
    }
    InitializeTeleportListener() {
      window.ctx.call("ColyTransform", "InitializeTeleportListener", [this.ptr]);
    }
    IsMoving() {
      return window.ctx.call("ColyTransform", "IsMoving", [this.ptr]).val() === 1;
    }
    OnDestroy() {
      window.ctx.call("ColyTransform", "OnDestroy", [this.ptr]);
    }
    OnDisable() {
      window.ctx.call("ColyTransform", "OnDisable", [this.ptr]);
    }
    OnEnable() {
      window.ctx.call("ColyTransform", "OnEnable", [this.ptr]);
    }
    OnNetworkSpawned(arg0) {
      window.ctx.call("ColyTransform", "OnNetworkSpawned", [this.ptr, arg0]);
    }
    OnRigidChange(arg0, arg1) {
      window.ctx.call("ColyTransform", "OnRigidChange", [this.ptr, arg0, arg1]);
    }
    OnTeleportTimeChange(arg0, arg1) {
      window.ctx.call("ColyTransform", "OnTeleportTimeChange", [this.ptr, arg0, arg1]);
    }
    SendPositionUpdate(arg0, arg1, arg2) {
      window.ctx.call("ColyTransform", "SendPositionUpdate", [this.ptr, arg0, arg1, arg2]);
    }
    SetAirLocal(arg0) {
      window.ctx.call("ColyTransform", "SetAirLocal", [this.ptr, arg0]);
    }
    Teleport(arg0, arg1) {
      window.ctx.call("ColyTransform", "Teleport", [this.ptr, arg0, arg1]);
    }
    UnregisterRigidChange() {
      window.ctx.call("ColyTransform", "UnregisterRigidChange", [this.ptr]);
    }
    UnregisterTeleportChange() {
      window.ctx.call("ColyTransform", "UnregisterTeleportChange", [this.ptr]);
    }
    Update() {
      window.ctx.call("ColyTransform", "Update", [this.ptr]);
    }
    UpdateLocalPlayer() {
      window.ctx.call("ColyTransform", "UpdateLocalPlayer", [this.ptr]);
    }
    UpdateRemotePlayer() {
      window.ctx.call("ColyTransform", "UpdateRemotePlayer", [this.ptr]);
    }
  }
  class SpringInterpolationMethod {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class Shaker {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get GlobalShakers() {
      return this.ptr.readField(0, "i32");
    }
    set GlobalShakers(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get activeShakes() {
      return this.ptr.readField(20, "i32");
    }
    set activeShakes(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get addToGlobalShakers() {
      return this.ptr.readField(16, "i32").val() === 1;
    }
    set addToGlobalShakers(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    AddShake(arg0) {
      window.ctx.call("MilkShake.Shaker", "AddShake", [this.ptr, arg0]);
    }
    static AddShakeAll(arg0) {
      window.ctx.call("MilkShake.Shaker", "AddShakeAll", [arg0]);
    }
    Awake() {
      window.ctx.call("MilkShake.Shaker", "Awake", [this.ptr]);
    }
    OnDestroy() {
      window.ctx.call("MilkShake.Shaker", "OnDestroy", [this.ptr]);
    }
    Shake(arg0, arg1) {
      return new ShakeInstance(window.ctx.call("MilkShake.Shaker", "Shake", [this.ptr, arg0, arg1]));
    }
    static ShakeAll(arg0, arg1) {
      return new ShakeInstance(window.ctx.call("MilkShake.Shaker", "ShakeAll", [arg0, arg1]));
    }
    static ShakeAllFromPoint(arg0, arg1, arg2, arg3, arg4) {
      window.ctx.call("MilkShake.Shaker", "ShakeAllFromPoint", [arg0, arg1, arg2, arg3, arg4]);
    }
    static ShakeAllSeparate(arg0, arg1, arg2) {
      window.ctx.call("MilkShake.Shaker", "ShakeAllSeparate", [arg0, arg1, arg2]);
    }
    ShakeFromPoint(arg0, arg1, arg2, arg3) {
      return new ShakeInstance(
        window.ctx.call("MilkShake.Shaker", "ShakeFromPoint", [this.ptr, arg0, arg1, arg2, arg3]),
      );
    }
    Update() {
      window.ctx.call("MilkShake.Shaker", "Update", [this.ptr]);
    }
  }
  class CapsuleCollider {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get center() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.CapsuleCollider", "get_center", [out, this.ptr]);
        return out;
      })();
    }
    set center(value) {
      window.ctx.call("UnityEngine.CapsuleCollider", "set_center", [this.ptr, value]);
    }
    get direction() {
      return window.ctx.call("UnityEngine.CapsuleCollider", "get_direction", [this.ptr]).val();
    }
    set direction(value) {
      window.ctx.call("UnityEngine.CapsuleCollider", "set_direction", [this.ptr, value]);
    }
    get height() {
      return window.ctx.call("UnityEngine.CapsuleCollider", "get_height", [this.ptr]).val();
    }
    set height(value) {
      window.ctx.call("UnityEngine.CapsuleCollider", "set_height", [this.ptr, value]);
    }
    get radius() {
      return window.ctx.call("UnityEngine.CapsuleCollider", "get_radius", [this.ptr]).val();
    }
    set radius(value) {
      window.ctx.call("UnityEngine.CapsuleCollider", "set_radius", [this.ptr, value]);
    }
    static get_center_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.CapsuleCollider", "get_center_Injected", [arg0, arg1]);
    }
    static get_direction_Injected(arg0) {
      return window.ctx.call("UnityEngine.CapsuleCollider", "get_direction_Injected", [arg0]).val();
    }
    static get_height_Injected(arg0) {
      return window.ctx.call("UnityEngine.CapsuleCollider", "get_height_Injected", [arg0]).val();
    }
    static get_radius_Injected(arg0) {
      return window.ctx.call("UnityEngine.CapsuleCollider", "get_radius_Injected", [arg0]).val();
    }
    static set_center_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.CapsuleCollider", "set_center_Injected", [arg0, arg1]);
    }
    static set_direction_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.CapsuleCollider", "set_direction_Injected", [arg0, arg1]);
    }
    static set_height_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.CapsuleCollider", "set_height_Injected", [arg0, arg1]);
    }
    static set_radius_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.CapsuleCollider", "set_radius_Injected", [arg0, arg1]);
    }
  }
  class PhysicsMaterial {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get bounceCombine() {
      return new PhysicsMaterialCombine(
        window.ctx.call("UnityEngine.PhysicsMaterial", "get_bounceCombine", [this.ptr]),
      );
    }
    set bounceCombine(value) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "set_bounceCombine", [this.ptr, value]);
    }
    get bounciness() {
      return window.ctx.call("UnityEngine.PhysicsMaterial", "get_bounciness", [this.ptr]).val();
    }
    set bounciness(value) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "set_bounciness", [this.ptr, value]);
    }
    get dynamicFriction() {
      return window.ctx.call("UnityEngine.PhysicsMaterial", "get_dynamicFriction", [this.ptr]).val();
    }
    set dynamicFriction(value) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "set_dynamicFriction", [this.ptr, value]);
    }
    get frictionCombine() {
      return new PhysicsMaterialCombine(
        window.ctx.call("UnityEngine.PhysicsMaterial", "get_frictionCombine", [this.ptr]),
      );
    }
    set frictionCombine(value) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "set_frictionCombine", [this.ptr, value]);
    }
    get staticFriction() {
      return window.ctx.call("UnityEngine.PhysicsMaterial", "get_staticFriction", [this.ptr]).val();
    }
    set staticFriction(value) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "set_staticFriction", [this.ptr, value]);
    }
    static Internal_CreateDynamicsMaterial(arg0, arg1) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "Internal_CreateDynamicsMaterial", [arg0, arg1]);
    }
    static Internal_CreateDynamicsMaterial_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "Internal_CreateDynamicsMaterial_Injected", [arg0, arg1]);
    }
    static get_bounceCombine_Injected(arg0) {
      return new PhysicsMaterialCombine(
        window.ctx.call("UnityEngine.PhysicsMaterial", "get_bounceCombine_Injected", [arg0]),
      );
    }
    static get_bounciness_Injected(arg0) {
      return window.ctx.call("UnityEngine.PhysicsMaterial", "get_bounciness_Injected", [arg0]).val();
    }
    static get_dynamicFriction_Injected(arg0) {
      return window.ctx.call("UnityEngine.PhysicsMaterial", "get_dynamicFriction_Injected", [arg0]).val();
    }
    static get_frictionCombine_Injected(arg0) {
      return new PhysicsMaterialCombine(
        window.ctx.call("UnityEngine.PhysicsMaterial", "get_frictionCombine_Injected", [arg0]),
      );
    }
    static get_staticFriction_Injected(arg0) {
      return window.ctx.call("UnityEngine.PhysicsMaterial", "get_staticFriction_Injected", [arg0]).val();
    }
    static set_bounceCombine_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "set_bounceCombine_Injected", [arg0, arg1]);
    }
    static set_bounciness_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "set_bounciness_Injected", [arg0, arg1]);
    }
    static set_dynamicFriction_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "set_dynamicFriction_Injected", [arg0, arg1]);
    }
    static set_frictionCombine_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "set_frictionCombine_Injected", [arg0, arg1]);
    }
    static set_staticFriction_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.PhysicsMaterial", "set_staticFriction_Injected", [arg0, arg1]);
    }
  }
  class ICharacterController {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    AfterCharacterUpdate(arg0) {
      window.ctx.call("KinematicCharacterController.ICharacterController", "AfterCharacterUpdate", [this.ptr, arg0]);
    }
    BeforeCharacterUpdate(arg0) {
      window.ctx.call("KinematicCharacterController.ICharacterController", "BeforeCharacterUpdate", [this.ptr, arg0]);
    }
    IsStepHandlingAllowed() {
      return (
        window.ctx
          .call("KinematicCharacterController.ICharacterController", "IsStepHandlingAllowed", [this.ptr])
          .val() === 1
      );
    }
    OnDiscreteCollisionDetected(arg0) {
      window.ctx.call("KinematicCharacterController.ICharacterController", "OnDiscreteCollisionDetected", [
        this.ptr,
        arg0,
      ]);
    }
    OnGroundHit(arg0, arg1, arg2, arg3) {
      window.ctx.call("KinematicCharacterController.ICharacterController", "OnGroundHit", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
      ]);
    }
    OnMovementHit(arg0, arg1, arg2, arg3) {
      window.ctx.call("KinematicCharacterController.ICharacterController", "OnMovementHit", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
      ]);
    }
    PostGroundingUpdate(arg0) {
      window.ctx.call("KinematicCharacterController.ICharacterController", "PostGroundingUpdate", [this.ptr, arg0]);
    }
    ProcessHitStabilityReport(arg0, arg1, arg2, arg3, arg4, arg5) {
      window.ctx.call("KinematicCharacterController.ICharacterController", "ProcessHitStabilityReport", [
        this.ptr,
        arg0,
        arg1,
        arg2,
        arg3,
        arg4,
        arg5,
      ]);
    }
    UpdateRotation(arg0, arg1) {
      window.ctx.call("KinematicCharacterController.ICharacterController", "UpdateRotation", [this.ptr, arg0, arg1]);
    }
    UpdateVelocity(arg0, arg1) {
      window.ctx.call("KinematicCharacterController.ICharacterController", "UpdateVelocity", [this.ptr, arg0, arg1]);
    }
  }
  class CharacterTransientGroundingReport {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get FoundAnyGround() {
      return this.ptr.readField(0, "i32").val() === 1;
    }
    set FoundAnyGround(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    get GroundNormal() {
      return new Vector3(this.ptr.readField(4, "i32"));
    }
    set GroundNormal(value) {
      return this.ptr.writeField(4, "i32", value);
    }
    get InnerGroundNormal() {
      return new Vector3(this.ptr.readField(16, "i32"));
    }
    set InnerGroundNormal(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get IsStableOnGround() {
      return this.ptr.readField(1, "i32").val() === 1;
    }
    set IsStableOnGround(value) {
      return this.ptr.writeField(1, "i32", value);
    }
    get OuterGroundNormal() {
      return new Vector3(this.ptr.readField(28, "i32"));
    }
    set OuterGroundNormal(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get SnappingPrevented() {
      return this.ptr.readField(2, "i32").val() === 1;
    }
    set SnappingPrevented(value) {
      return this.ptr.writeField(2, "i32", value);
    }
    CopyFrom(arg0) {
      window.ctx.call("KinematicCharacterController.CharacterTransientGroundingReport", "CopyFrom", [this.ptr, arg0]);
    }
  }
  class RigidbodyInteractionType {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class StepHandlingMethod {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class PfpFrame {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get animateOnEnable() {
      return this.ptr.readField(16, "i32").val() === 1;
    }
    set animateOnEnable(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    get cachedScale() {
      return this.ptr.readField(20, "f32").val();
    }
    set cachedScale(value) {
      return this.ptr.writeField(20, "f32", value);
    }
    get deadFx() {
      return new GameObject(this.ptr.readField(36, "i32"));
    }
    set deadFx(value) {
      return this.ptr.writeField(36, "i32", value);
    }
    get disconnectedFx() {
      return new GameObject(this.ptr.readField(32, "i32"));
    }
    set disconnectedFx(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get healthSlider() {
      return new NonSelectableSlider(this.ptr.readField(64, "i32"));
    }
    set healthSlider(value) {
      return this.ptr.writeField(64, "i32", value);
    }
    get healthSliderColor() {
      return new UIImage(this.ptr.readField(68, "i32"));
    }
    set healthSliderColor(value) {
      return this.ptr.writeField(68, "i32", value);
    }
    get healthSliderColorGradient() {
      return new Gradient(this.ptr.readField(72, "i32"));
    }
    set healthSliderColorGradient(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get layer0() {
      return new UIImage(this.ptr.readField(52, "i32"));
    }
    set layer0(value) {
      return this.ptr.writeField(52, "i32", value);
    }
    get layer1() {
      return new UIImage(this.ptr.readField(56, "i32"));
    }
    set layer1(value) {
      return this.ptr.writeField(56, "i32", value);
    }
    get layer2() {
      return new UIImage(this.ptr.readField(60, "i32"));
    }
    set layer2(value) {
      return this.ptr.writeField(60, "i32", value);
    }
    get levelTxt() {
      return new TMPText(this.ptr.readField(40, "i32"));
    }
    set levelTxt(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get myPlayer() {
      return new PlayerState(this.ptr.readField(92, "i32"));
    }
    set myPlayer(value) {
      return this.ptr.writeField(92, "i32", value);
    }
    get pfpBg() {
      return new UIImage(this.ptr.readField(48, "i32"));
    }
    set pfpBg(value) {
      return this.ptr.writeField(48, "i32", value);
    }
    get pfpFrameType() {
      return this.ptr.readField(24, "i32");
    }
    set pfpFrameType(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get platformTxt() {
      return new TMPText(this.ptr.readField(44, "i32"));
    }
    set platformTxt(value) {
      return this.ptr.writeField(44, "i32", value);
    }
    get shieldProtectedColor() {
      return new Color(this.ptr.readField(76, "i32"));
    }
    set shieldProtectedColor(value) {
      return this.ptr.writeField(76, "i32", value);
    }
    get winStreakTxt() {
      return new TMPText(this.ptr.readField(28, "i32"));
    }
    set winStreakTxt(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    FetchProfileStatsAsync(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("PfpFrame", "FetchProfileStatsAsync", [out, this.ptr, arg0]);
        return out;
      })();
    }
    GetSelectedItems(arg0, arg1, arg2, arg3, arg4) {
      return window.ctx.call("PfpFrame", "GetSelectedItems", [this.ptr, arg0, arg1, arg2, arg3, arg4]);
    }
    Init_otherPlayerStats(otherPlayerStats) {
      window.ctx.call("PfpFrame", "Init_2706", [this.ptr, otherPlayerStats]);
    }
    Init_friend(friend) {
      window.ctx.call("PfpFrame", "Init_2640", [this.ptr, friend]);
    }
    Init_player(player) {
      window.ctx.call("PfpFrame", "Init_2551", [this.ptr, player]);
    }
    Init_user(user) {
      window.ctx.call("PfpFrame", "Init_2703", [this.ptr, user]);
    }
    InitFromStats(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("PfpFrame", "InitFromStats", [out, this.ptr, arg0]);
        return out;
      })();
    }
    IsPlayerInCurrentRoom() {
      return window.ctx.call("PfpFrame", "IsPlayerInCurrentRoom", [this.ptr]).val() === 1;
    }
    OnEnable() {
      window.ctx.call("PfpFrame", "OnEnable", [this.ptr]);
    }
    Update() {
      window.ctx.call("PfpFrame", "Update", [this.ptr]);
    }
  }
  class ColyseusSettings {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get Headers() {
      return window.ctx.call("Colyseus.ColyseusSettings", "get_Headers", [this.ptr]);
    }
    get WebRequestEndpoint() {
      return window.ctx.call("Colyseus.ColyseusSettings", "get_WebRequestEndpoint", [this.ptr]);
    }
    get WebSocketEndpoint() {
      return window.ctx.call("Colyseus.ColyseusSettings", "get_WebSocketEndpoint", [this.ptr]);
    }
    get _headersDictionary() {
      return this.ptr.readField(28, "i32").mstr();
    }
    set _headersDictionary(value) {
      return this.ptr.writeField(28, "i32", window.ctx.createMstr(value));
    }
    get _requestHeaders() {
      return JSArray(this.ptr.readField(24, "i32"));
    }
    set _requestHeaders(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get colyseusServerAddress() {
      return this.ptr.readField(12, "i32").mstr();
    }
    set colyseusServerAddress(value) {
      return this.ptr.writeField(12, "i32", window.ctx.createMstr(value));
    }
    get colyseusServerPort() {
      return this.ptr.readField(16, "i32").mstr();
    }
    set colyseusServerPort(value) {
      return this.ptr.writeField(16, "i32", window.ctx.createMstr(value));
    }
    get useSecureProtocol() {
      return this.ptr.readField(20, "i32").val() === 1;
    }
    set useSecureProtocol(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    BuildWebRequestEndpoint() {
      return window.ctx.call("Colyseus.ColyseusSettings", "BuildWebRequestEndpoint", [this.ptr]);
    }
    BuildWebSocketEndpoint() {
      return window.ctx.call("Colyseus.ColyseusSettings", "BuildWebSocketEndpoint", [this.ptr]);
    }
    static Clone(arg0) {
      return new ColyseusSettings(window.ctx.call("Colyseus.ColyseusSettings", "Clone", [arg0]));
    }
    GetBaseEndpoint(arg0) {
      return window.ctx.call("Colyseus.ColyseusSettings", "GetBaseEndpoint", [this.ptr, arg0]);
    }
    GetPort() {
      return window.ctx.call("Colyseus.ColyseusSettings", "GetPort", [this.ptr]).val();
    }
    GetRequestHeaders() {
      return window.ctx.call("Colyseus.ColyseusSettings", "GetRequestHeaders", [this.ptr]);
    }
    GetWebRequestEndpointScheme() {
      return window.ctx.call("Colyseus.ColyseusSettings", "GetWebRequestEndpointScheme", [this.ptr]);
    }
    GetWebSocketEndpointScheme() {
      return window.ctx.call("Colyseus.ColyseusSettings", "GetWebSocketEndpointScheme", [this.ptr]);
    }
    SetRequestHeaders(arg0) {
      window.ctx.call("Colyseus.ColyseusSettings", "SetRequestHeaders", [this.ptr, arg0]);
    }
    ShouldIncludeServerPort() {
      return window.ctx.call("Colyseus.ColyseusSettings", "ShouldIncludeServerPort", [this.ptr]).val() === 1;
    }
  }
  class Auth {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get Token() {
      return window.ctx.call("Colyseus.Auth", "get_Token", [this.ptr]);
    }
    set Token(value) {
      window.ctx.call("Colyseus.Auth", "set_Token", [this.ptr, value]);
    }
    get OnChangeHandlers() {
      return this.ptr.readField(12, "i32");
    }
    set OnChangeHandlers(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get PATH() {
      return this.ptr.readField(0, "i32").mstr();
    }
    set PATH(value) {
      return this.ptr.writeField(0, "i32", window.ctx.createMstr(value));
    }
    get TOKEN_CACHE_KEY() {
      return this.ptr.readField(4, "i32").mstr();
    }
    set TOKEN_CACHE_KEY(value) {
      return this.ptr.writeField(4, "i32", window.ctx.createMstr(value));
    }
    get _client() {
      return new ColyseusClient(this.ptr.readField(8, "i32"));
    }
    set _client(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    get initialized() {
      return this.ptr.readField(16, "i32").val() === 1;
    }
    set initialized(value) {
      return this.ptr.writeField(16, "i32", value);
    }
    GetUserData() {
      return window.ctx.call("Colyseus.Auth", "GetUserData", [this.ptr]);
    }
    OnChange(arg0) {
      return window.ctx.call("Colyseus.Auth", "OnChange", [this.ptr, arg0]);
    }
    RegisterWithEmailAndPassword(arg0, arg1, arg2) {
      return window.ctx.call("Colyseus.Auth", "RegisterWithEmailAndPassword", [this.ptr, arg0, arg1, arg2]);
    }
    RegisterWithEmailAndPassword_email_password_options(email, password, options) {
      return window.ctx.call("Colyseus.Auth", "RegisterWithEmailAndPassword_13139", [
        this.ptr,
        email,
        password,
        options,
      ]);
    }
    SendResetPasswordEmail(arg0, arg1) {
      return window.ctx.call("Colyseus.Auth", "SendResetPasswordEmail", [this.ptr, arg0, arg1]);
    }
    SignInAnonymously(arg0) {
      return window.ctx.call("Colyseus.Auth", "SignInAnonymously", [this.ptr, arg0]);
    }
    SignInAnonymously_options(options) {
      return window.ctx.call("Colyseus.Auth", "SignInAnonymously_13141", [this.ptr, options]);
    }
    SignInWithEmailAndPassword(arg0, arg1) {
      return window.ctx.call("Colyseus.Auth", "SignInWithEmailAndPassword", [this.ptr, arg0, arg1]);
    }
    SignInWithEmailAndPassword_email_password(email, password) {
      return window.ctx.call("Colyseus.Auth", "SignInWithEmailAndPassword_13140", [this.ptr, email, password]);
    }
    SignInWithProvider(arg0, arg1) {
      return window.ctx.call("Colyseus.Auth", "SignInWithProvider", [this.ptr, arg0, arg1]);
    }
    SignInWithProvider_providerName_settings(providerName, settings) {
      return window.ctx.call("Colyseus.Auth", "SignInWithProvider_13142", [this.ptr, providerName, settings]);
    }
    SignOut() {
      window.ctx.call("Colyseus.Auth", "SignOut", [this.ptr]);
    }
    emitChange(arg0) {
      window.ctx.call("Colyseus.Auth", "emitChange", [this.ptr, arg0]);
    }
    getAuthData(arg0) {
      return window.ctx.call("Colyseus.Auth", "getAuthData", [this.ptr, arg0]);
    }
  }
  class HTTP {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get AuthToken() {
      return this.ptr.readField(8, "i32").mstr();
    }
    set AuthToken(value) {
      return this.ptr.writeField(8, "i32", window.ctx.createMstr(value));
    }
    get _settings() {
      return new ColyseusSettings(this.ptr.readField(12, "i32"));
    }
    set _settings(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    _Delete_uriPath_jsonBody_headers(uriPath, jsonBody, headers) {
      return window.ctx.call("Colyseus.HTTP", "Delete_13125", [this.ptr, uriPath, jsonBody, headers]);
    }
    _Delete(arg0, arg1, arg2) {
      return window.ctx.call("Colyseus.HTTP", "Delete", [this.ptr, arg0, arg1, arg2]);
    }
    Get_uriPath_headers(uriPath, headers) {
      return window.ctx.call("Colyseus.HTTP", "Get_13123", [this.ptr, uriPath, headers]);
    }
    Get(arg0, arg1) {
      return window.ctx.call("Colyseus.HTTP", "Get", [this.ptr, arg0, arg1]);
    }
    GetRequestURL(arg0) {
      return window.ctx.call("Colyseus.HTTP", "GetRequestURL", [this.ptr, arg0]);
    }
    Post_uriPath_jsonBody_headers(uriPath, jsonBody, headers) {
      return window.ctx.call("Colyseus.HTTP", "Post_13124", [this.ptr, uriPath, jsonBody, headers]);
    }
    Post(arg0, arg1, arg2) {
      return window.ctx.call("Colyseus.HTTP", "Post", [this.ptr, arg0, arg1, arg2]);
    }
    Put_uriPath_jsonBody_headers(uriPath, jsonBody, headers) {
      return window.ctx.call("Colyseus.HTTP", "Put_13126", [this.ptr, uriPath, jsonBody, headers]);
    }
    Put(arg0, arg1, arg2) {
      return window.ctx.call("Colyseus.HTTP", "Put", [this.ptr, arg0, arg1, arg2]);
    }
    Request(arg0, arg1, arg2, arg3) {
      return window.ctx.call("Colyseus.HTTP", "Request", [this.ptr, arg0, arg1, arg2, arg3]);
    }
    Request_uriMethod_uriPath_jsonBody_headers(uriMethod, uriPath, jsonBody, headers) {
      return window.ctx.call("Colyseus.HTTP", "Request_1405", [this.ptr, uriMethod, uriPath, jsonBody, headers]);
    }
  }
  class ColyseusConnection {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get IsOpen() {
      return this.ptr.readField(28, "i32").val() === 1;
    }
    set IsOpen(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get ProcessingMessageQueue() {
      return this.ptr.readField(29, "i32").val() === 1;
    }
    set ProcessingMessageQueue(value) {
      return this.ptr.writeField(29, "i32", value);
    }
    Initialize() {
      window.ctx.call("Colyseus.ColyseusConnection", "Initialize", [this.ptr]);
    }
    _OnClose(arg0) {
      window.ctx.call("Colyseus.ColyseusConnection", "_OnClose", [this.ptr, arg0]);
    }
    _OnOpen() {
      window.ctx.call("Colyseus.ColyseusConnection", "_OnOpen", [this.ptr]);
    }
  }
  class JSONArray {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get Children() {
      return window.ctx.call("SimpleJSON.JSONArray", "get_Children", [this.ptr]);
    }
    get Count() {
      return window.ctx.call("SimpleJSON.JSONArray", "get_Count", [this.ptr]).val();
    }
    get Inline() {
      return window.ctx.call("SimpleJSON.JSONArray", "get_Inline", [this.ptr]).val() === 1;
    }
    set Inline(value) {
      window.ctx.call("SimpleJSON.JSONArray", "set_Inline", [this.ptr, value]);
    }
    get IsArray() {
      return window.ctx.call("SimpleJSON.JSONArray", "get_IsArray", [this.ptr]).val() === 1;
    }
    get Item() {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONArray", "get_Item", [this.ptr, aKey]));
    }
    set Item(value) {
      window.ctx.call("SimpleJSON.JSONArray", "set_Item", [this.ptr, aKey, value]);
    }
    get Tag() {
      return new JSONNodeType(window.ctx.call("SimpleJSON.JSONArray", "get_Tag", [this.ptr]));
    }
    get inline() {
      return this.ptr.readField(12, "i32").val() === 1;
    }
    set inline(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get m_List() {
      return this.ptr.readField(8, "i32");
    }
    set m_List(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    Add(arg0, arg1) {
      window.ctx.call("SimpleJSON.JSONArray", "Add", [this.ptr, arg0, arg1]);
    }
    Clear() {
      window.ctx.call("SimpleJSON.JSONArray", "Clear", [this.ptr]);
    }
    Clone() {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONArray", "Clone", [this.ptr]));
    }
    GetEnumerator() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("SimpleJSON.JSONArray", "GetEnumerator", [out, this.ptr]);
        return out;
      })();
    }
    Remove_aIndex(aIndexValue) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONArray", "Remove_10465", [this.ptr, aIndexValue]));
    }
    Remove_aNode(aNode) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONArray", "Remove_10466", [this.ptr, aNode]));
    }
    WriteToStringBuilder(arg0, arg1, arg2, arg3) {
      window.ctx.call("SimpleJSON.JSONArray", "WriteToStringBuilder", [this.ptr, arg0, arg1, arg2, arg3]);
    }
  }
  class JSONObject {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get Children() {
      return window.ctx.call("SimpleJSON.JSONObject", "get_Children", [this.ptr]);
    }
    get Count() {
      return window.ctx.call("SimpleJSON.JSONObject", "get_Count", [this.ptr]).val();
    }
    get Inline() {
      return window.ctx.call("SimpleJSON.JSONObject", "get_Inline", [this.ptr]).val() === 1;
    }
    set Inline(value) {
      window.ctx.call("SimpleJSON.JSONObject", "set_Inline", [this.ptr, value]);
    }
    get IsObject() {
      return window.ctx.call("SimpleJSON.JSONObject", "get_IsObject", [this.ptr]).val() === 1;
    }
    get Item() {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONObject", "get_Item", [this.ptr, aIndex]));
    }
    set Item(value) {
      window.ctx.call("SimpleJSON.JSONObject", "set_Item", [this.ptr, aIndex, value]);
    }
    get Tag() {
      return new JSONNodeType(window.ctx.call("SimpleJSON.JSONObject", "get_Tag", [this.ptr]));
    }
    get inline() {
      return this.ptr.readField(12, "i32").val() === 1;
    }
    set inline(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    get m_Dict() {
      return this.ptr.readField(8, "i32");
    }
    set m_Dict(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    Add(arg0, arg1) {
      window.ctx.call("SimpleJSON.JSONObject", "Add", [this.ptr, arg0, arg1]);
    }
    Clear() {
      window.ctx.call("SimpleJSON.JSONObject", "Clear", [this.ptr]);
    }
    Clone() {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONObject", "Clone", [this.ptr]));
    }
    GetEnumerator() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("SimpleJSON.JSONObject", "GetEnumerator", [out, this.ptr]);
        return out;
      })();
    }
    GetValueOrDefault(arg0, arg1) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONObject", "GetValueOrDefault", [this.ptr, arg0, arg1]));
    }
    HasKey(arg0) {
      return window.ctx.call("SimpleJSON.JSONObject", "HasKey", [this.ptr, arg0]).val() === 1;
    }
    Remove_aKey(aKeyValue) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONObject", "Remove_10491", [this.ptr, aKeyValue]));
    }
    Remove_aIndex(aIndexValue) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONObject", "Remove_10492", [this.ptr, aIndexValue]));
    }
    Remove_aNode(aNode) {
      return new JSONNode(window.ctx.call("SimpleJSON.JSONObject", "Remove_10493", [this.ptr, aNode]));
    }
    WriteToStringBuilder(arg0, arg1, arg2, arg3) {
      window.ctx.call("SimpleJSON.JSONObject", "WriteToStringBuilder", [this.ptr, arg0, arg1, arg2, arg3]);
    }
  }
  class JSONNodeType {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class GraphicsFormat {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class TextureDimension {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class RenderTextureFormat {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class RenderTextureMemoryless {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class VRTextureUsage {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ShadowSamplingMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class MaterialGlobalIlluminationFlags {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class Shader {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get disableBatching() {
      return new DisableBatchingType(window.ctx.call("UnityEngine.Shader", "get_disableBatching", [this.ptr]));
    }
    static get enabledGlobalKeywords() {
      return window.ctx.call("UnityEngine.Shader", "get_enabledGlobalKeywords", []);
    }
    static get globalKeywords() {
      return window.ctx.call("UnityEngine.Shader", "get_globalKeywords", []);
    }
    static get globalMaximumLOD() {
      return window.ctx.call("UnityEngine.Shader", "get_globalMaximumLOD", []).val();
    }
    static set globalMaximumLOD(value) {
      window.ctx.call("UnityEngine.Shader", "set_globalMaximumLOD", [value]);
    }
    static get globalRenderPipeline() {
      return window.ctx.call("UnityEngine.Shader", "get_globalRenderPipeline", []);
    }
    static set globalRenderPipeline(value) {
      window.ctx.call("UnityEngine.Shader", "set_globalRenderPipeline", [value]);
    }
    static get globalShaderHardwareTier() {
      return new ShaderHardwareTier(window.ctx.call("UnityEngine.Shader", "get_globalShaderHardwareTier", []));
    }
    static set globalShaderHardwareTier(value) {
      window.ctx.call("UnityEngine.Shader", "set_globalShaderHardwareTier", [value]);
    }
    get isSupported() {
      return window.ctx.call("UnityEngine.Shader", "get_isSupported", [this.ptr]).val() === 1;
    }
    get keywordSpace() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Shader", "get_keywordSpace", [out, this.ptr]);
        return out;
      })();
    }
    static get maximumChunksOverride() {
      return window.ctx.call("UnityEngine.Shader", "get_maximumChunksOverride", []).val();
    }
    static set maximumChunksOverride(value) {
      window.ctx.call("UnityEngine.Shader", "set_maximumChunksOverride", [value]);
    }
    get maximumLOD() {
      return window.ctx.call("UnityEngine.Shader", "get_maximumLOD", [this.ptr]).val();
    }
    set maximumLOD(value) {
      window.ctx.call("UnityEngine.Shader", "set_maximumLOD", [this.ptr, value]);
    }
    get passCount() {
      return window.ctx.call("UnityEngine.Shader", "get_passCount", [this.ptr]).val();
    }
    get renderQueue() {
      return window.ctx.call("UnityEngine.Shader", "get_renderQueue", [this.ptr]).val();
    }
    get subshaderCount() {
      return window.ctx.call("UnityEngine.Shader", "get_subshaderCount", [this.ptr]).val();
    }
    static CheckPropertyIndex(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "CheckPropertyIndex", [arg0, arg1]);
    }
    static CreateFromCompiledData(arg0, arg1) {
      return new Shader(window.ctx.call("UnityEngine.Shader", "CreateFromCompiledData", [arg0, arg1]));
    }
    static CreateFromCompiledData_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Shader", "CreateFromCompiledData_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    static DisableKeyword_keyword(keyword) {
      window.ctx.call("UnityEngine.Shader", "DisableKeyword_21305", [keyword]);
    }
    static DisableKeyword_keyword(keyword) {
      window.ctx.call("UnityEngine.Shader", "DisableKeyword_21312", [keyword]);
    }
    static DisableKeywordFast(arg0) {
      window.ctx.call("UnityEngine.Shader", "DisableKeywordFast", [arg0]);
    }
    static DisableKeywordFast_Injected(arg0) {
      window.ctx.call("UnityEngine.Shader", "DisableKeywordFast_Injected", [arg0]);
    }
    static DisableKeyword_Injected(arg0) {
      window.ctx.call("UnityEngine.Shader", "DisableKeyword_Injected", [arg0]);
    }
    static EnableKeyword_keyword(keyword) {
      window.ctx.call("UnityEngine.Shader", "EnableKeyword_21304", [keyword]);
    }
    static EnableKeyword_keyword(keyword) {
      window.ctx.call("UnityEngine.Shader", "EnableKeyword_21311", [keyword]);
    }
    static EnableKeywordFast(arg0) {
      window.ctx.call("UnityEngine.Shader", "EnableKeywordFast", [arg0]);
    }
    static EnableKeywordFast_Injected(arg0) {
      window.ctx.call("UnityEngine.Shader", "EnableKeywordFast_Injected", [arg0]);
    }
    static EnableKeyword_Injected(arg0) {
      window.ctx.call("UnityEngine.Shader", "EnableKeyword_Injected", [arg0]);
    }
    static ExtractGlobalFloatArray(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalFloatArray", [arg0, arg1]);
    }
    static ExtractGlobalFloatArrayImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalFloatArrayImpl", [arg0, arg1]);
    }
    static ExtractGlobalFloatArrayImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalFloatArrayImpl_Injected", [arg0, arg1]);
    }
    static ExtractGlobalMatrixArray(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalMatrixArray", [arg0, arg1]);
    }
    static ExtractGlobalMatrixArrayImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalMatrixArrayImpl", [arg0, arg1]);
    }
    static ExtractGlobalMatrixArrayImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalMatrixArrayImpl_Injected", [arg0, arg1]);
    }
    static ExtractGlobalPropertyNames(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalPropertyNames", [arg0, arg1]);
    }
    static ExtractGlobalPropertyNamesImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalPropertyNamesImpl", [arg0, arg1]);
    }
    static ExtractGlobalVectorArray(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalVectorArray", [arg0, arg1]);
    }
    static ExtractGlobalVectorArrayImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalVectorArrayImpl", [arg0, arg1]);
    }
    static ExtractGlobalVectorArrayImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "ExtractGlobalVectorArrayImpl_Injected", [arg0, arg1]);
    }
    static Find(arg0) {
      return new Shader(window.ctx.call("UnityEngine.Shader", "Find", [arg0]));
    }
    static FindBuiltin(arg0) {
      return new Shader(window.ctx.call("UnityEngine.Shader", "FindBuiltin", [arg0]));
    }
    static FindBuiltin_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Shader", "FindBuiltin_Injected", [out, arg0]);
        return out;
      })();
    }
    FindPassTagValue_passIndex_tagName(passIndex, tagName) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Shader", "FindPassTagValue_21328", [out, this.ptr, passIndex, tagName]);
        return out;
      })();
    }
    FindPassTagValue_subshaderIndex_passIndex_tagName(subshaderIndex, passIndex, tagName) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Shader", "FindPassTagValue_21329", [
          out,
          this.ptr,
          subshaderIndex,
          passIndex,
          tagName,
        ]);
        return out;
      })();
    }
    FindPropertyIndex(arg0) {
      return window.ctx.call("UnityEngine.Shader", "FindPropertyIndex", [this.ptr, arg0]).val();
    }
    static FindPropertyIndex_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Shader", "FindPropertyIndex_Injected", [arg0, arg1]).val();
    }
    FindSubshaderTagValue(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Shader", "FindSubshaderTagValue", [out, this.ptr, arg0, arg1]);
        return out;
      })();
    }
    FindTextureStack(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Shader", "FindTextureStack", [this.ptr, arg0, arg1, arg2]).val() === 1;
    }
    static FindTextureStackImpl(arg0, arg1, arg2, arg3) {
      return window.ctx.call("UnityEngine.Shader", "FindTextureStackImpl", [arg0, arg1, arg2, arg3]).val() === 1;
    }
    static FindTextureStackImpl_Injected(arg0, arg1, arg2, arg3) {
      return (
        window.ctx.call("UnityEngine.Shader", "FindTextureStackImpl_Injected", [arg0, arg1, arg2, arg3]).val() === 1
      );
    }
    static GetAllGlobalKeywords() {
      return window.ctx.call("UnityEngine.Shader", "GetAllGlobalKeywords", []);
    }
    static GetAllGlobalKeywords_Injected(arg0) {
      window.ctx.call("UnityEngine.Shader", "GetAllGlobalKeywords_Injected", [arg0]);
    }
    GetDependency(arg0) {
      return new Shader(window.ctx.call("UnityEngine.Shader", "GetDependency", [this.ptr, arg0]));
    }
    static GetDependency_Injected(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Shader", "GetDependency_Injected", [out, arg0, arg1]);
        return out;
      })();
    }
    static GetEnabledGlobalKeywords() {
      return window.ctx.call("UnityEngine.Shader", "GetEnabledGlobalKeywords", []);
    }
    static GetEnabledGlobalKeywords_Injected(arg0) {
      window.ctx.call("UnityEngine.Shader", "GetEnabledGlobalKeywords_Injected", [arg0]);
    }
    static GetGlobalColor_name(name) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Shader", "GetGlobalColor_21415", [out, name]);
        return out;
      })();
    }
    static GetGlobalColor_nameID(nameID) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Shader", "GetGlobalColor_21416", [out, nameID]);
        return out;
      })();
    }
    static GetGlobalFloat_name(name) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalFloat_21409", [name]).val();
    }
    static GetGlobalFloat_nameID(nameID) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalFloat_21410", [nameID]).val();
    }
    static GetGlobalFloatArray_name(name) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalFloatArray_21421", [name]);
    }
    static GetGlobalFloatArray_nameID(nameID) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalFloatArray_21422", [nameID]);
    }
    static GetGlobalFloatArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalFloatArray_21427", [name, values]);
    }
    static GetGlobalFloatArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalFloatArray_21428", [nameID, values]);
    }
    static GetGlobalFloatArrayCountImpl(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalFloatArrayCountImpl", [arg0]).val();
    }
    static GetGlobalFloatArrayImpl(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalFloatArrayImpl", [arg0]);
    }
    static GetGlobalFloatArrayImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalFloatArrayImpl_Injected", [arg0, arg1]);
    }
    static GetGlobalFloatImpl(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalFloatImpl", [arg0]).val();
    }
    static GetGlobalInt_name(name) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalInt_21407", [name]).val();
    }
    static GetGlobalInt_nameID(nameID) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalInt_21408", [nameID]).val();
    }
    static GetGlobalIntImpl(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalIntImpl", [arg0]).val();
    }
    static GetGlobalInteger_name(name) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalInteger_21411", [name]).val();
    }
    static GetGlobalInteger_nameID(nameID) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalInteger_21412", [nameID]).val();
    }
    static GetGlobalMatrix_name(name) {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Shader", "GetGlobalMatrix_21417", [out, name]);
        return out;
      })();
    }
    static GetGlobalMatrix_nameID(nameID) {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Shader", "GetGlobalMatrix_21418", [out, nameID]);
        return out;
      })();
    }
    static GetGlobalMatrixArray_name(name) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalMatrixArray_21425", [name]);
    }
    static GetGlobalMatrixArray_nameID(nameID) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalMatrixArray_21426", [nameID]);
    }
    static GetGlobalMatrixArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalMatrixArray_21431", [name, values]);
    }
    static GetGlobalMatrixArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalMatrixArray_21432", [nameID, values]);
    }
    static GetGlobalMatrixArrayCountImpl(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalMatrixArrayCountImpl", [arg0]).val();
    }
    static GetGlobalMatrixArrayImpl(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalMatrixArrayImpl", [arg0]);
    }
    static GetGlobalMatrixArrayImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalMatrixArrayImpl_Injected", [arg0, arg1]);
    }
    static GetGlobalMatrixImpl(arg0) {
      return (() => {
        let out = window.ctx.malloc(64);
        window.ctx.call("UnityEngine.Shader", "GetGlobalMatrixImpl", [out, arg0]);
        return out;
      })();
    }
    static GetGlobalMatrixImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalMatrixImpl_Injected", [arg0, arg1]);
    }
    static GetGlobalPropertyCount() {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalPropertyCount", []).val();
    }
    static GetGlobalPropertyCountImpl(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalPropertyCountImpl", [arg0]).val();
    }
    static GetGlobalPropertyNames(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalPropertyNames", [arg0, arg1]);
    }
    static GetGlobalTexture_name(name) {
      return new Texture(window.ctx.call("UnityEngine.Shader", "GetGlobalTexture_21419", [name]));
    }
    static GetGlobalTexture_nameID(nameID) {
      return new Texture(window.ctx.call("UnityEngine.Shader", "GetGlobalTexture_21420", [nameID]));
    }
    static GetGlobalTextureImpl(arg0) {
      return new Texture(window.ctx.call("UnityEngine.Shader", "GetGlobalTextureImpl", [arg0]));
    }
    static GetGlobalTextureImpl_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Shader", "GetGlobalTextureImpl_Injected", [out, arg0]);
        return out;
      })();
    }
    static GetGlobalVector_name(name) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Shader", "GetGlobalVector_21413", [out, name]);
        return out;
      })();
    }
    static GetGlobalVector_nameID(nameID) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Shader", "GetGlobalVector_21414", [out, nameID]);
        return out;
      })();
    }
    static GetGlobalVectorArray_name(name) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalVectorArray_21423", [name]);
    }
    static GetGlobalVectorArray_nameID(nameID) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalVectorArray_21424", [nameID]);
    }
    static GetGlobalVectorArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalVectorArray_21429", [name, values]);
    }
    static GetGlobalVectorArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalVectorArray_21430", [nameID, values]);
    }
    static GetGlobalVectorArrayCountImpl(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalVectorArrayCountImpl", [arg0]).val();
    }
    static GetGlobalVectorArrayImpl(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetGlobalVectorArrayImpl", [arg0]);
    }
    static GetGlobalVectorArrayImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalVectorArrayImpl_Injected", [arg0, arg1]);
    }
    static GetGlobalVectorImpl(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Shader", "GetGlobalVectorImpl", [out, arg0]);
        return out;
      })();
    }
    static GetGlobalVectorImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "GetGlobalVectorImpl_Injected", [arg0, arg1]);
    }
    GetPassCountInSubshader(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetPassCountInSubshader", [this.ptr, arg0]).val();
    }
    static GetPassCountInSubshader_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Shader", "GetPassCountInSubshader_Injected", [arg0, arg1]).val();
    }
    static GetPropertyAttributes_shader_propertyIndex(shader, propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyAttributes_21440", [shader, propertyIndex]);
    }
    GetPropertyAttributes_propertyIndex(propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyAttributes_21454", [this.ptr, propertyIndex]);
    }
    static GetPropertyAttributes_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyAttributes_Injected", [arg0, arg1]);
    }
    GetPropertyCount() {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyCount", [this.ptr]).val();
    }
    static GetPropertyCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyCount_Injected", [arg0]).val();
    }
    GetPropertyDefaultFloatValue(arg0) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyDefaultFloatValue", [this.ptr, arg0]).val();
    }
    static GetPropertyDefaultIntValue_shader_propertyIndex(shader, propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyDefaultIntValue_21441", [shader, propertyIndex]).val();
    }
    GetPropertyDefaultIntValue_propertyIndex(propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyDefaultIntValue_21458", [this.ptr, propertyIndex]).val();
    }
    static GetPropertyDefaultIntValue_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyDefaultIntValue_Injected", [arg0, arg1]).val();
    }
    static GetPropertyDefaultValue(arg0, arg1) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Shader", "GetPropertyDefaultValue", [out, arg0, arg1]);
        return out;
      })();
    }
    static GetPropertyDefaultValue_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "GetPropertyDefaultValue_Injected", [arg0, arg1, arg2]);
    }
    GetPropertyDefaultVectorValue(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Shader", "GetPropertyDefaultVectorValue", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetPropertyDescription_shader_propertyIndex(shader, propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyDescription_21438", [shader, propertyIndex]);
    }
    GetPropertyDescription_propertyIndex(propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyDescription_21452", [this.ptr, propertyIndex]);
    }
    static GetPropertyDescription_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "GetPropertyDescription_Injected", [arg0, arg1, arg2]);
    }
    static GetPropertyFlags_shader_propertyIndex(shader, propertyIndex) {
      return new ShaderPropertyFlags(
        window.ctx.call("UnityEngine.Shader", "GetPropertyFlags_21439", [shader, propertyIndex]),
      );
    }
    GetPropertyFlags_propertyIndex(propertyIndex) {
      return new ShaderPropertyFlags(
        window.ctx.call("UnityEngine.Shader", "GetPropertyFlags_21453", [this.ptr, propertyIndex]),
      );
    }
    static GetPropertyFlags_Injected(arg0, arg1) {
      return new ShaderPropertyFlags(window.ctx.call("UnityEngine.Shader", "GetPropertyFlags_Injected", [arg0, arg1]));
    }
    static GetPropertyName_shader_propertyIndex(shader, propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyName_21435", [shader, propertyIndex]);
    }
    GetPropertyName_propertyIndex(propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyName_21449", [this.ptr, propertyIndex]);
    }
    static GetPropertyNameId_shader_propertyIndex(shader, propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyNameId_21436", [shader, propertyIndex]).val();
    }
    GetPropertyNameId_propertyIndex(propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyNameId_21450", [this.ptr, propertyIndex]).val();
    }
    static GetPropertyNameId_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyNameId_Injected", [arg0, arg1]).val();
    }
    static GetPropertyName_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "GetPropertyName_Injected", [arg0, arg1, arg2]);
    }
    GetPropertyRangeLimits(arg0) {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.Shader", "GetPropertyRangeLimits", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static GetPropertyTextureDefaultName_shader_propertyIndex(shader, propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyTextureDefaultName_21444", [shader, propertyIndex]);
    }
    GetPropertyTextureDefaultName_propertyIndex(propertyIndex) {
      return window.ctx.call("UnityEngine.Shader", "GetPropertyTextureDefaultName_21460", [this.ptr, propertyIndex]);
    }
    static GetPropertyTextureDefaultName_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "GetPropertyTextureDefaultName_Injected", [arg0, arg1, arg2]);
    }
    static GetPropertyTextureDimension_shader_propertyIndex(shader, propertyIndex) {
      return new TextureDimension(
        window.ctx.call("UnityEngine.Shader", "GetPropertyTextureDimension_21443", [shader, propertyIndex]),
      );
    }
    GetPropertyTextureDimension_propertyIndex(propertyIndex) {
      return new TextureDimension(
        window.ctx.call("UnityEngine.Shader", "GetPropertyTextureDimension_21459", [this.ptr, propertyIndex]),
      );
    }
    static GetPropertyTextureDimension_Injected(arg0, arg1) {
      return new TextureDimension(
        window.ctx.call("UnityEngine.Shader", "GetPropertyTextureDimension_Injected", [arg0, arg1]),
      );
    }
    static GetPropertyType_shader_propertyIndex(shader, propertyIndex) {
      return new ShaderPropertyType(
        window.ctx.call("UnityEngine.Shader", "GetPropertyType_21437", [shader, propertyIndex]),
      );
    }
    GetPropertyType_propertyIndex(propertyIndex) {
      return new ShaderPropertyType(
        window.ctx.call("UnityEngine.Shader", "GetPropertyType_21451", [this.ptr, propertyIndex]),
      );
    }
    static GetPropertyType_Injected(arg0, arg1) {
      return new ShaderPropertyType(window.ctx.call("UnityEngine.Shader", "GetPropertyType_Injected", [arg0, arg1]));
    }
    static IDToTag(arg0) {
      return window.ctx.call("UnityEngine.Shader", "IDToTag", [arg0]);
    }
    static IDToTag_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "IDToTag_Injected", [arg0, arg1]);
    }
    Internal_FindPassTagValue(arg0, arg1) {
      return window.ctx.call("UnityEngine.Shader", "Internal_FindPassTagValue", [this.ptr, arg0, arg1]).val();
    }
    Internal_FindPassTagValueInSubShader(arg0, arg1, arg2) {
      return window.ctx
        .call("UnityEngine.Shader", "Internal_FindPassTagValueInSubShader", [this.ptr, arg0, arg1, arg2])
        .val();
    }
    static Internal_FindPassTagValueInSubShader_Injected(arg0, arg1, arg2, arg3) {
      return window.ctx
        .call("UnityEngine.Shader", "Internal_FindPassTagValueInSubShader_Injected", [arg0, arg1, arg2, arg3])
        .val();
    }
    static Internal_FindPassTagValue_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Shader", "Internal_FindPassTagValue_Injected", [arg0, arg1, arg2]).val();
    }
    Internal_FindSubshaderTagValue(arg0, arg1) {
      return window.ctx.call("UnityEngine.Shader", "Internal_FindSubshaderTagValue", [this.ptr, arg0, arg1]).val();
    }
    static Internal_FindSubshaderTagValue_Injected(arg0, arg1, arg2) {
      return window.ctx.call("UnityEngine.Shader", "Internal_FindSubshaderTagValue_Injected", [arg0, arg1, arg2]).val();
    }
    static IsKeywordEnabled_keyword(keyword) {
      return window.ctx.call("UnityEngine.Shader", "IsKeywordEnabled_21306", [keyword]).val() === 1;
    }
    static IsKeywordEnabled_keyword(keyword) {
      return window.ctx.call("UnityEngine.Shader", "IsKeywordEnabled_21314", [keyword]).val() === 1;
    }
    static IsKeywordEnabledFast(arg0) {
      return window.ctx.call("UnityEngine.Shader", "IsKeywordEnabledFast", [arg0]).val() === 1;
    }
    static IsKeywordEnabledFast_Injected(arg0) {
      return window.ctx.call("UnityEngine.Shader", "IsKeywordEnabledFast_Injected", [arg0]).val() === 1;
    }
    static IsKeywordEnabled_Injected(arg0) {
      return window.ctx.call("UnityEngine.Shader", "IsKeywordEnabled_Injected", [arg0]).val() === 1;
    }
    static PropertyToID(arg0) {
      return window.ctx.call("UnityEngine.Shader", "PropertyToID", [arg0]).val();
    }
    static PropertyToID_Injected(arg0) {
      return window.ctx.call("UnityEngine.Shader", "PropertyToID_Injected", [arg0]).val();
    }
    static SetGlobalBuffer_name_value(name, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalBuffer_21385", [name, value]);
    }
    static SetGlobalBuffer_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalBuffer_21386", [nameID, value]);
    }
    static SetGlobalBuffer_name_value(name, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalBuffer_21387", [name, value]);
    }
    static SetGlobalBuffer_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalBuffer_21388", [nameID, value]);
    }
    static SetGlobalBufferImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalBufferImpl", [arg0, arg1]);
    }
    static SetGlobalBufferImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalBufferImpl_Injected", [arg0, arg1]);
    }
    static SetGlobalColor_name_value(name, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalColor_21377", [name, value]);
    }
    static SetGlobalColor_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalColor_21378", [nameID, value]);
    }
    static SetGlobalConstantBuffer_name_value_offset_size(name, value, offset, size) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalConstantBuffer_21389", [name, value, offset, size]);
    }
    static SetGlobalConstantBuffer_nameID_value_offset_size(nameID, value, offset, size) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalConstantBuffer_21390", [nameID, value, offset, size]);
    }
    static SetGlobalConstantBuffer_name_value_offset_size(name, value, offset, size) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalConstantBuffer_21391", [name, value, offset, size]);
    }
    static SetGlobalConstantBuffer_nameID_value_offset_size(nameID, value, offset, size) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalConstantBuffer_21392", [nameID, value, offset, size]);
    }
    static SetGlobalConstantBufferImpl(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalConstantBufferImpl", [arg0, arg1, arg2, arg3]);
    }
    static SetGlobalConstantBufferImpl_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalConstantBufferImpl_Injected", [arg0, arg1, arg2, arg3]);
    }
    static SetGlobalConstantGraphicsBufferImpl(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalConstantGraphicsBufferImpl", [arg0, arg1, arg2, arg3]);
    }
    static SetGlobalConstantGraphicsBufferImpl_Injected(arg0, arg1, arg2, arg3) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalConstantGraphicsBufferImpl_Injected", [arg0, arg1, arg2, arg3]);
    }
    static SetGlobalFloat_name_value(name, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalFloat_21371", [name, value]);
    }
    static SetGlobalFloat_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalFloat_21372", [nameID, value]);
    }
    static SetGlobalFloatArray_name_values_count(name, values, count) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalFloatArray_21362", [name, values, count]);
    }
    static SetGlobalFloatArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalFloatArray_21395", [name, values]);
    }
    static SetGlobalFloatArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalFloatArray_21396", [nameID, values]);
    }
    static SetGlobalFloatArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalFloatArray_21397", [name, values]);
    }
    static SetGlobalFloatArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalFloatArray_21398", [nameID, values]);
    }
    static SetGlobalFloatArrayImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalFloatArrayImpl", [arg0, arg1, arg2]);
    }
    static SetGlobalFloatArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalFloatArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    static SetGlobalFloatImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalFloatImpl", [arg0, arg1]);
    }
    static SetGlobalGraphicsBufferImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalGraphicsBufferImpl", [arg0, arg1]);
    }
    static SetGlobalGraphicsBufferImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalGraphicsBufferImpl_Injected", [arg0, arg1]);
    }
    static SetGlobalInt_name_value(name, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalInt_21369", [name, value]);
    }
    static SetGlobalInt_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalInt_21370", [nameID, value]);
    }
    static SetGlobalIntImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalIntImpl", [arg0, arg1]);
    }
    static SetGlobalInteger_name_value(name, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalInteger_21373", [name, value]);
    }
    static SetGlobalInteger_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalInteger_21374", [nameID, value]);
    }
    static SetGlobalMatrix_name_value(name, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrix_21379", [name, value]);
    }
    static SetGlobalMatrix_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrix_21380", [nameID, value]);
    }
    static SetGlobalMatrixArray_name_values_count(name, values, count) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrixArray_21364", [name, values, count]);
    }
    static SetGlobalMatrixArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrixArray_21403", [name, values]);
    }
    static SetGlobalMatrixArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrixArray_21404", [nameID, values]);
    }
    static SetGlobalMatrixArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrixArray_21405", [name, values]);
    }
    static SetGlobalMatrixArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrixArray_21406", [nameID, values]);
    }
    static SetGlobalMatrixArrayImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrixArrayImpl", [arg0, arg1, arg2]);
    }
    static SetGlobalMatrixArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrixArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    static SetGlobalMatrixImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrixImpl", [arg0, arg1]);
    }
    static SetGlobalMatrixImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalMatrixImpl_Injected", [arg0, arg1]);
    }
    static SetGlobalRayTracingAccelerationStructure_name_value(name, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalRayTracingAccelerationStructure_21393", [name, value]);
    }
    static SetGlobalRayTracingAccelerationStructure_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalRayTracingAccelerationStructure_21394", [nameID, value]);
    }
    static SetGlobalRayTracingAccelerationStructureImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalRayTracingAccelerationStructureImpl", [arg0, arg1]);
    }
    static SetGlobalRayTracingAccelerationStructureImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalRayTracingAccelerationStructureImpl_Injected", [arg0, arg1]);
    }
    static SetGlobalRenderTextureImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalRenderTextureImpl", [arg0, arg1, arg2]);
    }
    static SetGlobalRenderTextureImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalRenderTextureImpl_Injected", [arg0, arg1, arg2]);
    }
    static SetGlobalTexture_name_value(name, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalTexture_21381", [name, value]);
    }
    static SetGlobalTexture_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalTexture_21382", [nameID, value]);
    }
    static SetGlobalTexture_name_value_element(name, value, element) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalTexture_21383", [name, value, element]);
    }
    static SetGlobalTexture_nameID_value_element(nameID, value, element) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalTexture_21384", [nameID, value, element]);
    }
    static SetGlobalTextureImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalTextureImpl", [arg0, arg1]);
    }
    static SetGlobalTextureImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalTextureImpl_Injected", [arg0, arg1]);
    }
    static SetGlobalVector_name_value(name, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVector_21375", [name, value]);
    }
    static SetGlobalVector_nameID_value(nameID, value) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVector_21376", [nameID, value]);
    }
    static SetGlobalVectorArray_name_values_count(name, values, count) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVectorArray_21363", [name, values, count]);
    }
    static SetGlobalVectorArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVectorArray_21399", [name, values]);
    }
    static SetGlobalVectorArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVectorArray_21400", [nameID, values]);
    }
    static SetGlobalVectorArray_name_values(name, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVectorArray_21401", [name, values]);
    }
    static SetGlobalVectorArray_nameID_values(nameID, values) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVectorArray_21402", [nameID, values]);
    }
    static SetGlobalVectorArrayImpl(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVectorArrayImpl", [arg0, arg1, arg2]);
    }
    static SetGlobalVectorArrayImpl_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVectorArrayImpl_Injected", [arg0, arg1, arg2]);
    }
    static SetGlobalVectorImpl(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVectorImpl", [arg0, arg1]);
    }
    static SetGlobalVectorImpl_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetGlobalVectorImpl_Injected", [arg0, arg1]);
    }
    static SetKeyword(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetKeyword", [arg0, arg1]);
    }
    static SetKeywordFast(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetKeywordFast", [arg0, arg1]);
    }
    static SetKeywordFast_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "SetKeywordFast_Injected", [arg0, arg1]);
    }
    static TagToID(arg0) {
      return window.ctx.call("UnityEngine.Shader", "TagToID", [arg0]).val();
    }
    static TagToID_Injected(arg0) {
      return window.ctx.call("UnityEngine.Shader", "TagToID_Injected", [arg0]).val();
    }
    static WarmupAllShaders() {
      window.ctx.call("UnityEngine.Shader", "WarmupAllShaders", []);
    }
    static get_disableBatching_Injected(arg0) {
      return new DisableBatchingType(window.ctx.call("UnityEngine.Shader", "get_disableBatching_Injected", [arg0]));
    }
    static get_globalRenderPipeline_Injected(arg0) {
      window.ctx.call("UnityEngine.Shader", "get_globalRenderPipeline_Injected", [arg0]);
    }
    static get_isSupported_Injected(arg0) {
      return window.ctx.call("UnityEngine.Shader", "get_isSupported_Injected", [arg0]).val() === 1;
    }
    static get_keywordSpace_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "get_keywordSpace_Injected", [arg0, arg1]);
    }
    static get_maximumLOD_Injected(arg0) {
      return window.ctx.call("UnityEngine.Shader", "get_maximumLOD_Injected", [arg0]).val();
    }
    static get_passCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Shader", "get_passCount_Injected", [arg0]).val();
    }
    static get_renderQueue_Injected(arg0) {
      return window.ctx.call("UnityEngine.Shader", "get_renderQueue_Injected", [arg0]).val();
    }
    static get_subshaderCount_Injected(arg0) {
      return window.ctx.call("UnityEngine.Shader", "get_subshaderCount_Injected", [arg0]).val();
    }
    static set_globalRenderPipeline_Injected(arg0) {
      window.ctx.call("UnityEngine.Shader", "set_globalRenderPipeline_Injected", [arg0]);
    }
    static set_maximumLOD_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Shader", "set_maximumLOD_Injected", [arg0, arg1]);
    }
  }
  class AnimatorControllerParameterType {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class TrailRendererAlignment {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class Gradient {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get colorKeys() {
      return window.ctx.call("UnityEngine.Gradient", "get_colorKeys", [this.ptr]);
    }
    get m_Ptr() {
      return new IntPtr(this.ptr.readField(8, "i32"));
    }
    set m_Ptr(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    get m_RequiresNativeCleanup() {
      return this.ptr.readField(12, "i32").val() === 1;
    }
    set m_RequiresNativeCleanup(value) {
      return this.ptr.writeField(12, "i32", value);
    }
    Cleanup() {
      window.ctx.call("UnityEngine.Gradient", "Cleanup", [this.ptr]);
    }
    static Cleanup_Injected(arg0) {
      window.ctx.call("UnityEngine.Gradient", "Cleanup_Injected", [arg0]);
    }
    Equals_o(o) {
      return window.ctx.call("UnityEngine.Gradient", "Equals_23300", [this.ptr, o]).val() === 1;
    }
    Equals_other(other) {
      return window.ctx.call("UnityEngine.Gradient", "Equals_23301", [this.ptr, other]).val() === 1;
    }
    Evaluate(arg0) {
      return (() => {
        let out = window.ctx.malloc(16);
        window.ctx.call("UnityEngine.Gradient", "Evaluate", [out, this.ptr, arg0]);
        return out;
      })();
    }
    static Evaluate_Injected(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.Gradient", "Evaluate_Injected", [arg0, arg1, arg2]);
    }
    Finalize() {
      window.ctx.call("UnityEngine.Gradient", "Finalize", [this.ptr]);
    }
    GetHashCode() {
      return window.ctx.call("UnityEngine.Gradient", "GetHashCode", [this.ptr]).val();
    }
    static Init() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.Gradient", "Init", [out]);
        return out;
      })();
    }
    Internal_Equals(arg0) {
      return window.ctx.call("UnityEngine.Gradient", "Internal_Equals", [this.ptr, arg0]).val() === 1;
    }
    static Internal_Equals_Injected(arg0, arg1) {
      return window.ctx.call("UnityEngine.Gradient", "Internal_Equals_Injected", [arg0, arg1]).val() === 1;
    }
    static get_colorKeys_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.Gradient", "get_colorKeys_Injected", [arg0, arg1]);
    }
  }
  class TrailRendererMaskInteraction {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class TrailRendererTextureMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ParticleSystemScalingMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ParticleSystemSimulationSpace {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class TextureWrapMode {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class TextureColorSpace {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class HideFlags {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class TextureFormat {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ShakeInstance {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get CurrentRoughness() {
      return window.ctx.call("MilkShake.ShakeInstance", "get_CurrentRoughness", [this.ptr]).val();
    }
    get CurrentStrength() {
      return window.ctx.call("MilkShake.ShakeInstance", "get_CurrentStrength", [this.ptr]).val();
    }
    get IsFinished() {
      return window.ctx.call("MilkShake.ShakeInstance", "get_IsFinished", [this.ptr]).val() === 1;
    }
    get IsPaused() {
      return window.ctx.call("MilkShake.ShakeInstance", "get_IsPaused", [this.ptr]).val() === 1;
    }
    set IsPaused(value) {
      window.ctx.call("MilkShake.ShakeInstance", "set_IsPaused", [this.ptr, value]);
    }
    get State() {
      return new ShakeState(window.ctx.call("MilkShake.ShakeInstance", "get_State", [this.ptr]));
    }
    set State(value) {
      window.ctx.call("MilkShake.ShakeInstance", "set_State", [this.ptr, value]);
    }
    get _IsPaused_k_BackingField() {
      return this.ptr.readField(28, "i32").val() === 1;
    }
    set _IsPaused_k_BackingField(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get _State_k_BackingField() {
      return new ShakeState(this.ptr.readField(24, "i32"));
    }
    set _State_k_BackingField(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get RemoveWhenStopped() {
      return this.ptr.readField(20, "i32").val() === 1;
    }
    set RemoveWhenStopped(value) {
      return this.ptr.writeField(20, "i32", value);
    }
    get RoughnessScale() {
      return this.ptr.readField(16, "f32").val();
    }
    set RoughnessScale(value) {
      return this.ptr.writeField(16, "f32", value);
    }
    get ShakeParameters() {
      return new ShakeParameters(this.ptr.readField(8, "i32"));
    }
    set ShakeParameters(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    get StrengthScale() {
      return this.ptr.readField(12, "f32").val();
    }
    set StrengthScale(value) {
      return this.ptr.writeField(12, "f32", value);
    }
    get baseSeed() {
      return this.ptr.readField(32, "i32").val();
    }
    set baseSeed(value) {
      return this.ptr.writeField(32, "i32", value);
    }
    get fadeInTime() {
      return this.ptr.readField(56, "f32").val();
    }
    set fadeInTime(value) {
      return this.ptr.writeField(56, "f32", value);
    }
    get fadeOutTime() {
      return this.ptr.readField(60, "f32").val();
    }
    set fadeOutTime(value) {
      return this.ptr.writeField(60, "f32", value);
    }
    get fadeTimer() {
      return this.ptr.readField(52, "f32").val();
    }
    set fadeTimer(value) {
      return this.ptr.writeField(52, "f32", value);
    }
    get lastUpdatedFrame() {
      return this.ptr.readField(72, "i32").val();
    }
    set lastUpdatedFrame(value) {
      return this.ptr.writeField(72, "i32", value);
    }
    get noiseTimer() {
      return this.ptr.readField(48, "f32").val();
    }
    set noiseTimer(value) {
      return this.ptr.writeField(48, "f32", value);
    }
    get pauseFadeTime() {
      return this.ptr.readField(68, "f32").val();
    }
    set pauseFadeTime(value) {
      return this.ptr.writeField(68, "f32", value);
    }
    get pauseTimer() {
      return this.ptr.readField(64, "f32").val();
    }
    set pauseTimer(value) {
      return this.ptr.writeField(64, "f32", value);
    }
    get seed1() {
      return this.ptr.readField(36, "f32").val();
    }
    set seed1(value) {
      return this.ptr.writeField(36, "f32", value);
    }
    get seed2() {
      return this.ptr.readField(40, "f32").val();
    }
    set seed2(value) {
      return this.ptr.writeField(40, "f32", value);
    }
    get seed3() {
      return this.ptr.readField(44, "f32").val();
    }
    set seed3(value) {
      return this.ptr.writeField(44, "f32", value);
    }
    Pause(arg0) {
      window.ctx.call("MilkShake.ShakeInstance", "Pause", [this.ptr, arg0]);
    }
    Resume(arg0) {
      window.ctx.call("MilkShake.ShakeInstance", "Resume", [this.ptr, arg0]);
    }
    Start(arg0) {
      window.ctx.call("MilkShake.ShakeInstance", "Start", [this.ptr, arg0]);
    }
    Stop(arg0, arg1) {
      window.ctx.call("MilkShake.ShakeInstance", "Stop", [this.ptr, arg0, arg1]);
    }
    TogglePaused(arg0) {
      window.ctx.call("MilkShake.ShakeInstance", "TogglePaused", [this.ptr, arg0]);
    }
    UpdateShake(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("MilkShake.ShakeInstance", "UpdateShake", [out, this.ptr, arg0]);
        return out;
      })();
    }
    getNoise(arg0, arg1) {
      return window.ctx.call("MilkShake.ShakeInstance", "getNoise", [this.ptr, arg0, arg1]).val();
    }
    getPositionShake() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("MilkShake.ShakeInstance", "getPositionShake", [out, this.ptr]);
        return out;
      })();
    }
    getRotationShake() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("MilkShake.ShakeInstance", "getRotationShake", [out, this.ptr]);
        return out;
      })();
    }
  }
  class PhysicsMaterialCombine {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class NonSelectableSlider {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get value() {
      return window.ctx.call("NonSelectableSlider", "get_value", [this.ptr]).val();
    }
    set value(value) {
      window.ctx.call("NonSelectableSlider", "set_value", [this.ptr, value]);
    }
    get _value() {
      return this.ptr.readField(20, "f32").val();
    }
    set _value(value) {
      return this.ptr.writeField(20, "f32", value);
    }
    get clampMinValue() {
      return this.ptr.readField(16, "f32").val();
    }
    set clampMinValue(value) {
      return this.ptr.writeField(16, "f32", value);
    }
    get fill() {
      return new RectTransform(this.ptr.readField(24, "i32"));
    }
    set fill(value) {
      return this.ptr.writeField(24, "i32", value);
    }
    get rightToLeft() {
      return this.ptr.readField(28, "i32").val() === 1;
    }
    set rightToLeft(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    OnEnable() {
      window.ctx.call("NonSelectableSlider", "OnEnable", [this.ptr]);
    }
    UpdateFill() {
      window.ctx.call("NonSelectableSlider", "UpdateFill", [this.ptr]);
    }
  }
  class DisableBatchingType {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ShaderHardwareTier {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ShaderPropertyFlags {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ShaderPropertyType {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ShakeState {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }
  class ShakeParameters {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get FadeIn() {
      return window.ctx.call("MilkShake.ShakeParameters", "get_FadeIn", [this.ptr]).val();
    }
    set FadeIn(value) {
      window.ctx.call("MilkShake.ShakeParameters", "set_FadeIn", [this.ptr, value]);
    }
    get FadeOut() {
      return window.ctx.call("MilkShake.ShakeParameters", "get_FadeOut", [this.ptr]).val();
    }
    set FadeOut(value) {
      window.ctx.call("MilkShake.ShakeParameters", "set_FadeOut", [this.ptr, value]);
    }
    get PositionInfluence() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("MilkShake.ShakeParameters", "get_PositionInfluence", [out, this.ptr]);
        return out;
      })();
    }
    set PositionInfluence(value) {
      window.ctx.call("MilkShake.ShakeParameters", "set_PositionInfluence", [this.ptr, value]);
    }
    get RotationInfluence() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("MilkShake.ShakeParameters", "get_RotationInfluence", [out, this.ptr]);
        return out;
      })();
    }
    set RotationInfluence(value) {
      window.ctx.call("MilkShake.ShakeParameters", "set_RotationInfluence", [this.ptr, value]);
    }
    get Roughness() {
      return window.ctx.call("MilkShake.ShakeParameters", "get_Roughness", [this.ptr]).val();
    }
    set Roughness(value) {
      window.ctx.call("MilkShake.ShakeParameters", "set_Roughness", [this.ptr, value]);
    }
    get ShakeType() {
      return new ShakePresetShakeType(window.ctx.call("MilkShake.ShakeParameters", "get_ShakeType", [this.ptr]));
    }
    set ShakeType(value) {
      window.ctx.call("MilkShake.ShakeParameters", "set_ShakeType", [this.ptr, value]);
    }
    get Strength() {
      return window.ctx.call("MilkShake.ShakeParameters", "get_Strength", [this.ptr]).val();
    }
    set Strength(value) {
      window.ctx.call("MilkShake.ShakeParameters", "set_Strength", [this.ptr, value]);
    }
    get fadeIn() {
      return this.ptr.readField(20, "f32").val();
    }
    set fadeIn(value) {
      return this.ptr.writeField(20, "f32", value);
    }
    get fadeOut() {
      return this.ptr.readField(24, "f32").val();
    }
    set fadeOut(value) {
      return this.ptr.writeField(24, "f32", value);
    }
    get positionInfluence() {
      return new Vector3(this.ptr.readField(28, "i32"));
    }
    set positionInfluence(value) {
      return this.ptr.writeField(28, "i32", value);
    }
    get rotationInfluence() {
      return new Vector3(this.ptr.readField(40, "i32"));
    }
    set rotationInfluence(value) {
      return this.ptr.writeField(40, "i32", value);
    }
    get roughness() {
      return this.ptr.readField(16, "f32").val();
    }
    set roughness(value) {
      return this.ptr.writeField(16, "f32", value);
    }
    get shakeType() {
      return new ShakePresetShakeType(this.ptr.readField(8, "i32"));
    }
    set shakeType(value) {
      return this.ptr.writeField(8, "i32", value);
    }
    get strength() {
      return this.ptr.readField(12, "f32").val();
    }
    set strength(value) {
      return this.ptr.writeField(12, "f32", value);
    }
  }
  class RectTransform {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
    get anchoredPosition() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.RectTransform", "get_anchoredPosition", [out, this.ptr]);
        return out;
      })();
    }
    set anchoredPosition(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_anchoredPosition", [this.ptr, value]);
    }
    get anchoredPosition3D() {
      return (() => {
        let out = window.ctx.malloc(12);
        window.ctx.call("UnityEngine.RectTransform", "get_anchoredPosition3D", [out, this.ptr]);
        return out;
      })();
    }
    set anchoredPosition3D(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_anchoredPosition3D", [this.ptr, value]);
    }
    get anchorMax() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.RectTransform", "get_anchorMax", [out, this.ptr]);
        return out;
      })();
    }
    set anchorMax(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_anchorMax", [this.ptr, value]);
    }
    get anchorMin() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.RectTransform", "get_anchorMin", [out, this.ptr]);
        return out;
      })();
    }
    set anchorMin(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_anchorMin", [this.ptr, value]);
    }
    get drivenByObject() {
      return new UnityObject(window.ctx.call("UnityEngine.RectTransform", "get_drivenByObject", [this.ptr]));
    }
    set drivenByObject(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_drivenByObject", [this.ptr, value]);
    }
    get drivenProperties() {
      return new DrivenTransformProperties(
        window.ctx.call("UnityEngine.RectTransform", "get_drivenProperties", [this.ptr]),
      );
    }
    set drivenProperties(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_drivenProperties", [this.ptr, value]);
    }
    get offsetMax() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.RectTransform", "get_offsetMax", [out, this.ptr]);
        return out;
      })();
    }
    set offsetMax(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_offsetMax", [this.ptr, value]);
    }
    get offsetMin() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.RectTransform", "get_offsetMin", [out, this.ptr]);
        return out;
      })();
    }
    set offsetMin(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_offsetMin", [this.ptr, value]);
    }
    get pivot() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.RectTransform", "get_pivot", [out, this.ptr]);
        return out;
      })();
    }
    set pivot(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_pivot", [this.ptr, value]);
    }
    get rect() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RectTransform", "get_rect", [out, this.ptr]);
        return out;
      })();
    }
    get sendChildDimensionsChange() {
      return window.ctx.call("UnityEngine.RectTransform", "get_sendChildDimensionsChange", [this.ptr]).val() === 1;
    }
    set sendChildDimensionsChange(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_sendChildDimensionsChange", [this.ptr, value]);
    }
    get sizeDelta() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.RectTransform", "get_sizeDelta", [out, this.ptr]);
        return out;
      })();
    }
    set sizeDelta(value) {
      window.ctx.call("UnityEngine.RectTransform", "set_sizeDelta", [this.ptr, value]);
    }
    get reapplyDrivenProperties() {
      return this.ptr.readField(0, "i32");
    }
    set reapplyDrivenProperties(value) {
      return this.ptr.writeField(0, "i32", value);
    }
    ForceUpdateRectTransforms() {
      window.ctx.call("UnityEngine.RectTransform", "ForceUpdateRectTransforms", [this.ptr]);
    }
    static ForceUpdateRectTransforms_Injected(arg0) {
      window.ctx.call("UnityEngine.RectTransform", "ForceUpdateRectTransforms_Injected", [arg0]);
    }
    GetLocalCorners(arg0) {
      window.ctx.call("UnityEngine.RectTransform", "GetLocalCorners", [this.ptr, arg0]);
    }
    GetParentSize() {
      return (() => {
        let out = window.ctx.malloc(8);
        window.ctx.call("UnityEngine.RectTransform", "GetParentSize", [out, this.ptr]);
        return out;
      })();
    }
    GetRectInParentSpace() {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RectTransform", "GetRectInParentSpace", [out, this.ptr]);
        return out;
      })();
    }
    GetWorldCorners(arg0) {
      window.ctx.call("UnityEngine.RectTransform", "GetWorldCorners", [this.ptr, arg0]);
    }
    static SendReapplyDrivenProperties(arg0) {
      window.ctx.call("UnityEngine.RectTransform", "SendReapplyDrivenProperties", [arg0]);
    }
    SetInsetAndSizeFromParentEdge(arg0, arg1, arg2) {
      window.ctx.call("UnityEngine.RectTransform", "SetInsetAndSizeFromParentEdge", [this.ptr, arg0, arg1, arg2]);
    }
    SetSizeWithCurrentAnchors(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "SetSizeWithCurrentAnchors", [this.ptr, arg0, arg1]);
    }
    static get_anchorMax_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "get_anchorMax_Injected", [arg0, arg1]);
    }
    static get_anchorMin_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "get_anchorMin_Injected", [arg0, arg1]);
    }
    static get_anchoredPosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "get_anchoredPosition_Injected", [arg0, arg1]);
    }
    static get_drivenByObject_Injected(arg0) {
      return (() => {
        let out = window.ctx.malloc(50);
        window.ctx.call("UnityEngine.RectTransform", "get_drivenByObject_Injected", [out, arg0]);
        return out;
      })();
    }
    static get_drivenProperties_Injected(arg0) {
      return new DrivenTransformProperties(
        window.ctx.call("UnityEngine.RectTransform", "get_drivenProperties_Injected", [arg0]),
      );
    }
    static get_pivot_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "get_pivot_Injected", [arg0, arg1]);
    }
    static get_rect_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "get_rect_Injected", [arg0, arg1]);
    }
    static get_sendChildDimensionsChange_Injected(arg0) {
      return window.ctx.call("UnityEngine.RectTransform", "get_sendChildDimensionsChange_Injected", [arg0]).val() === 1;
    }
    static get_sizeDelta_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "get_sizeDelta_Injected", [arg0, arg1]);
    }
    static set_anchorMax_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "set_anchorMax_Injected", [arg0, arg1]);
    }
    static set_anchorMin_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "set_anchorMin_Injected", [arg0, arg1]);
    }
    static set_anchoredPosition_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "set_anchoredPosition_Injected", [arg0, arg1]);
    }
    static set_drivenByObject_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "set_drivenByObject_Injected", [arg0, arg1]);
    }
    static set_drivenProperties_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "set_drivenProperties_Injected", [arg0, arg1]);
    }
    static set_pivot_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "set_pivot_Injected", [arg0, arg1]);
    }
    static set_sendChildDimensionsChange_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "set_sendChildDimensionsChange_Injected", [arg0, arg1]);
    }
    static set_sizeDelta_Injected(arg0, arg1) {
      window.ctx.call("UnityEngine.RectTransform", "set_sizeDelta_Injected", [arg0, arg1]);
    }
  }
  class DrivenTransformProperties {
    constructor(ptr) {
      this.ptr = ptr;
      this.ptrRef = (obj) => obj?.ptr ?? obj;
    }
  }

  // ===== Cheat configuration (all menu options; saved to localStorage["recte_config"]) =====
  var config = {
    rage: {
      killall: false,
      infammo: false,
      firerate: false,
      autofire: false,
      norecoil: false,
      fly: false,
      flyspeed: 100,
      noknockback: true,
      crash: false,
      speed: 0,
      nofriction: false,
      chatspam: false,
      roastall: false,
      invisibility: false,
      grav: -24.5,
      nograv: false,
      instantrespawn: false,
      neckrotation: 0,
      test: false,
      range: false,
      stepheight: 0.2,
      spider: 65.8,
      jumpheight: 10,
      oneshot: false,
      damage: 0,
      bulletshitrandom: false,
      nocooldown: false,
      noshield: false,
      aimspeed: 0.1,
      aimbot: false,
      playermagnetdist: 5,
      playermagnet: false,
      shootthroughwalls: false,
      spinbot: false,
      aimbone: "Head",
      stickytargeting: false,
      aimkey: "Shift",
      triggerbot: false,
      hovertokill: false,
      fastswitch: false,
      aimtype: "Center of screen",
      aimbottype: "Aimbot",
      friendlyfire: false,
      targetswitchinterval: 0,
    },
    visuals: {
      fov: 80,
      chams: false,
      hideflash: false,
      hands: false,
      wireframe: true,
      nosmoke: false,
      handscolor: "#ffffff",
      playervisiblecolor: "#00ff00",
      playerhiddencolor: "#ff0000",
      box: true,
      filledbox: true,
      skeleton: true,
      skeletonthickness: 2,
      skeletoncolor: "#ff0000",
      skeletonrainbow: false,
      name: true,
      cornerbox: true,
      tracer: true,
      boxthickness: 2,
      boxcolor: "#ff0000",
      boxrainbow: false,
      cornerboxthickness: 2,
      cornerboxcolor: "#ff0000",
      cornerboxrainbow: false,
      filledboxcolor: "rgba(255, 0, 0, 0.3)",
      filledboxrainbow: false,
      namesize: 16,
      namecolor: "#ffffff",
      tracerto: "Feet",
      tracerfrom: "Bottom Center",
      tracercolor: "#ff0000",
      tracerthickness: 2,
      namerainbow: false,
      gunesp: true,
      healthesp: true,
      gunespsize: 16,
      gunrainbow: false,
      gunespcolor: "#ffffff",
      healthespsize: 16,
      healthesprainbow: false,
      healthespcolor: "#ffffff",
      transparentshield: true,
      userinfolocation: "Head",
      healthtext: true,
      healthbar: true,
      fovcolor: "#ff0000",
      fovrainbow: false,
      fov: false,
      fovsize: 90,
      esp: true,
      distanceesp: true,
      distancesize: 16,
      distancerainbow: false,
      distancecolor: "#ffffff",
    },
    loadout: {
      primary: "Assault Rifle",
      secondary: "Energy Pistols",
      melee: "Katana",
      grenades: "Smoke",
    },
    settings: {
      toggle: "P",
      keyOptions: [
        "Shift",
        "Ctrl",
        "Alt",
        "Space",
        "CapsLock",
        "Tab",
        "Q",
        "E",
        "R",
        "F",
        "V",
        "B",
        "0",
        "Insert",
        "F9",
        "O",
        "I",
        "P",
        "Backquote",
        "G",
        "C",
        "L",
        "F",
        "None",
      ],
      godmodekey: "None",
      wallbangkey: "None",
      chamskey: "None",
      espkey: "None",
      loadoutkey: "None",
      inviskey: "None",
      flykey: "None",
      spinbotkey: "None",
    },
  };

  // ===== Bundled @msgpack/msgpack (used to decode / re-encode the game's binary WebSocket packets) =====
  var sharedTextEncoder = new TextEncoder();
  var TEXT_ENCODER_THRESHOLD = 50;
  function utf8EncodeTE(str, output, outputOffset) {
    sharedTextEncoder.encodeInto(str, output.subarray(outputOffset));
  }
  function utf8Encode(str, output, outputOffset) {
    if (str.length > TEXT_ENCODER_THRESHOLD) {
      utf8EncodeTE(str, output, outputOffset);
    } else {
      utf8EncodeJs(str, output, outputOffset);
    }
  }
  var CHUNK_SIZE = 4096;
  function utf8DecodeJs(bytes, inputOffset, byteLength) {
    let offset = inputOffset;
    let end = offset + byteLength;
    let units = [];
    let result = "";
    while (offset < end) {
      let byte1 = bytes[offset++];
      if ((byte1 & 128) === 0) {
        units.push(byte1);
      } else if ((byte1 & 224) === 192) {
        let byte2 = bytes[offset++] & 63;
        units.push(((byte1 & 31) << 6) | byte2);
      } else if ((byte1 & 240) === 224) {
        let byte2 = bytes[offset++] & 63;
        let byte3 = bytes[offset++] & 63;
        units.push(((byte1 & 31) << 12) | (byte2 << 6) | byte3);
      } else if ((byte1 & 248) === 240) {
        let byte2 = bytes[offset++] & 63;
        let byte3 = bytes[offset++] & 63;
        let byte4 = bytes[offset++] & 63;
        let unit = ((byte1 & 7) << 18) | (byte2 << 12) | (byte3 << 6) | byte4;
        if (unit > 65535) {
          unit -= 65536;
          units.push(((unit >>> 10) & 1023) | 55296);
          unit = 56320 | (unit & 1023);
        }
        units.push(unit);
      } else {
        units.push(byte1);
      }
      if (units.length >= CHUNK_SIZE) {
        result += String.fromCharCode(...units);
        units.length = 0;
      }
    }
    if (units.length > 0) {
      result += String.fromCharCode(...units);
    }
    return result;
  }
  var sharedTextDecoder = new TextDecoder();
  var TEXT_DECODER_THRESHOLD = 200;
  function utf8Decode(bytes, inputOffset, byteLength) {
    return byteLength > TEXT_DECODER_THRESHOLD
      ? utf8DecodeTD(bytes, inputOffset, byteLength)
      : utf8DecodeJs(bytes, inputOffset, byteLength);
  }
  class ExtData {
    constructor(type, data) {
      this.type = type;
      this.data = data;
    }
  }
  class DecodeError extends Error {
    constructor(message) {
      super(message);
      let proto = Object.create(DecodeError.prototype);
      Object.setPrototypeOf(this, proto);
      Object.defineProperty(this, "name", {
        configurable: true,
        enumerable: false,
        value: DecodeError.name,
      });
    }
  }
  var UINT32_MAX = 0xffffffff;
  function setUint64(view, offset, value) {
    let high = value / 4294967296;
    let low = value;
    view.setUint32(offset, high);
    view.setUint32(offset + 4, low);
  }
  function setInt64(view, offset, value) {
    let high = Math.floor(value / 4294967296);
    let low = value;
    view.setUint32(offset, high);
    view.setUint32(offset + 4, low);
  }
  function getInt64(view, offset) {
    let high = view.getInt32(offset);
    let low = view.getUint32(offset + 4);
    return high * 4294967296 + low;
  }
  function getUint64(view, offset) {
    let high = view.getUint32(offset);
    let low = view.getUint32(offset + 4);
    return high * 4294967296 + low;
  }
  var EXT_TIMESTAMP = -1;
  var TIMESTAMP32_MAX_SEC = 0xffffffff;
  var TIMESTAMP64_MAX_SEC = 0x3ffffffff;
  function encodeDateToTimeSpec(date) {
    let msec = date.getTime();
    let sec = Math.floor(msec / 1000);
    let nsec = (msec - sec * 1000) * 1000000;
    let nsecInSec = Math.floor(nsec / 1000000000);
    return {
      sec: sec + nsecInSec,
      nsec: nsec - nsecInSec * 1000000000,
    };
  }
  function encodeTimestampExtension(object) {
    if (object instanceof Date) {
      let timeSpec = encodeDateToTimeSpec(object);
      return encodeTimeSpecToTimestamp(timeSpec);
    } else {
      return null;
    }
  }
  function decodeTimestampToTimeSpec(data) {
    let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    switch (data.byteLength) {
      case 4:
        return {
          sec: view.getUint32(0),
          nsec: 0,
        };
      case 8: {
        let nsec30AndSecHigh2 = view.getUint32(0);
        let secLow32 = view.getUint32(4);
        let sec = (nsec30AndSecHigh2 & 3) * 4294967296 + secLow32;
        let nsec = nsec30AndSecHigh2 >>> 2;
        return {
          sec: sec,
          nsec: nsec,
        };
      }
      case 12: {
        let sec = getInt64(view, 4);
        let nsec = view.getUint32(0);
        return {
          sec: sec,
          nsec: nsec,
        };
      }
      default:
        throw new DecodeError("Unrecognized data size for timestamp (expected 4, 8, or 12): " + data.length);
    }
  }
  function decodeTimestampExtension(data) {
    let timeSpec = decodeTimestampToTimeSpec(data);
    return new Date(timeSpec.sec * 1000 + timeSpec.nsec / 1000000);
  }
  var timestampExtension = {
    type: EXT_TIMESTAMP,
    encode: encodeTimestampExtension,
    decode: decodeTimestampExtension,
  };
  class ExtensionCodec {
    constructor() {
      this.builtInEncoders = [];
      this.builtInDecoders = [];
      this.encoders = [];
      this.decoders = [];
      this.register(timestampExtension);
    }
    register({ type: type, encode: encode, decode: decode }) {
      if (type >= 0) {
        this.encoders[type] = encode;
        this.decoders[type] = decode;
      } else {
        let builtinIndex = -1 - type;
        this.builtInEncoders[builtinIndex] = encode;
        this.builtInDecoders[builtinIndex] = decode;
      }
    }
    tryToEncode(object, context) {
      for (let i = 0; i < this.builtInEncoders.length; i++) {
        let encodeExt = this.builtInEncoders[i];
        if (encodeExt != null) {
          let data = encodeExt(object, context);
          if (data != null) {
            let type = -1 - i;
            return new ExtData(type, data);
          }
        }
      }
      for (let i = 0; i < this.encoders.length; i++) {
        let encodeExt = this.encoders[i];
        if (encodeExt != null) {
          let data = encodeExt(object, context);
          if (data != null) {
            let type = i;
            return new ExtData(type, data);
          }
        }
      }
      return object instanceof ExtData ? object : null;
    }
    decode(data, type, context) {
      let decodeExt = type < 0 ? this.builtInDecoders[-1 - type] : this.decoders[type];
      return decodeExt ? decodeExt(data, type, context) : new ExtData(type, data);
    }
  }
  ExtensionCodec.defaultCodec = new ExtensionCodec();
  function isArrayBufferLike(buffer) {
    return buffer instanceof ArrayBuffer || (typeof SharedArrayBuffer < "u" && buffer instanceof SharedArrayBuffer);
  }
  function ensureUint8Array(buffer) {
    return buffer instanceof Uint8Array
      ? buffer
      : ArrayBuffer.isView(buffer)
        ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
        : isArrayBufferLike(buffer)
          ? new Uint8Array(buffer)
          : Uint8Array.from(buffer);
  }
  var DEFAULT_MAX_DEPTH = 100;
  var DEFAULT_INITIAL_BUFFER_SIZE = 2048;
  class Encoder {
    constructor(options) {
      this.entered = false;
      this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
      this.context = options?.context;
      this.useBigInt64 = options?.useBigInt64 ?? false;
      this.maxDepth = options?.maxDepth ?? DEFAULT_MAX_DEPTH;
      this.initialBufferSize = options?.initialBufferSize ?? DEFAULT_INITIAL_BUFFER_SIZE;
      this.sortKeys = options?.sortKeys ?? false;
      this.forceFloat32 = options?.forceFloat32 ?? false;
      this.ignoreUndefined = options?.ignoreUndefined ?? false;
      this.forceIntegerToFloat = options?.forceIntegerToFloat ?? false;
      this.pos = 0;
      this.view = new DataView(new ArrayBuffer(this.initialBufferSize));
      this.bytes = new Uint8Array(this.view.buffer);
    }
    clone() {
      return new Encoder({
        extensionCodec: this.extensionCodec,
        context: this.context,
        useBigInt64: this.useBigInt64,
        maxDepth: this.maxDepth,
        initialBufferSize: this.initialBufferSize,
        sortKeys: this.sortKeys,
        forceFloat32: this.forceFloat32,
        ignoreUndefined: this.ignoreUndefined,
        forceIntegerToFloat: this.forceIntegerToFloat,
      });
    }
    reinitializeState() {
      this.pos = 0;
    }
    encodeSharedRef(object) {
      if (this.entered) {
        return this.clone().encodeSharedRef(object);
      }
      try {
        this.entered = true;
        this.reinitializeState();
        this.doEncode(object, 1);
        return this.bytes.subarray(0, this.pos);
      } finally {
        this.entered = false;
      }
    }
    encode(object) {
      if (this.entered) {
        return this.clone().encode(object);
      }
      try {
        this.entered = true;
        this.reinitializeState();
        this.doEncode(object, 1);
        return this.bytes.slice(0, this.pos);
      } finally {
        this.entered = false;
      }
    }
    doEncode(object, depth) {
      if (depth > this.maxDepth) {
        throw new Error("Too deep objects in depth " + depth);
      }
      if (object == null) {
        this.encodeNil();
      } else if (typeof object == "boolean") {
        this.encodeBoolean(object);
      } else if (typeof object == "number") {
        if (this.forceIntegerToFloat) {
          this.encodeNumberAsFloat(object);
        } else {
          this.encodeNumber(object);
        }
      } else if (typeof object == "string") {
        this.encodeString(object);
      } else if (this.useBigInt64 && typeof object == "bigint") {
        this.encodeBigInt64(object);
      } else {
        this.encodeObject(object, depth);
      }
    }
    ensureBufferSizeToWrite(sizeToWrite) {
      let requiredSize = this.pos + sizeToWrite;
      if (this.view.byteLength < requiredSize) {
        this.resizeBuffer(requiredSize * 2);
      }
    }
    resizeBuffer(newSize) {
      let newBuffer = new ArrayBuffer(newSize);
      let newBytes = new Uint8Array(newBuffer);
      let newView = new DataView(newBuffer);
      newBytes.set(this.bytes);
      this.view = newView;
      this.bytes = newBytes;
    }
    encodeNil() {
      this.writeU8(192);
    }
    encodeBoolean(object) {
      if (object === false) {
        this.writeU8(194);
      } else {
        this.writeU8(195);
      }
    }
    encodeNumber(object) {
      if (!this.forceIntegerToFloat && Number.isSafeInteger(object)) {
        if (object >= 0) {
          if (object < 128) {
            this.writeU8(object);
          } else if (object < 256) {
            this.writeU8(204);
            this.writeU8(object);
          } else if (object < 65536) {
            this.writeU8(205);
            this.writeU16(object);
          } else if (object < 4294967296) {
            this.writeU8(206);
            this.writeU32(object);
          } else if (this.useBigInt64) {
            this.encodeNumberAsFloat(object);
          } else {
            this.writeU8(207);
            this.writeU64(object);
          }
        } else if (object >= -32) {
          this.writeU8(224 | (object + 32));
        } else if (object >= -128) {
          this.writeU8(208);
          this.writeI8(object);
        } else if (object >= -32768) {
          this.writeU8(209);
          this.writeI16(object);
        } else if (object >= -2147483648) {
          this.writeU8(210);
          this.writeI32(object);
        } else if (this.useBigInt64) {
          this.encodeNumberAsFloat(object);
        } else {
          this.writeU8(211);
          this.writeI64(object);
        }
      } else {
        this.encodeNumberAsFloat(object);
      }
    }
    encodeNumberAsFloat(object) {
      if (this.forceFloat32) {
        this.writeU8(202);
        this.writeF32(object);
      } else {
        this.writeU8(203);
        this.writeF64(object);
      }
    }
    encodeBigInt64(object) {
      if (object >= BigInt(0)) {
        this.writeU8(207);
        this.writeBigUint64(object);
      } else {
        this.writeU8(211);
        this.writeBigInt64(object);
      }
    }
    writeStringHeader(byteLength) {
      if (byteLength < 32) {
        this.writeU8(160 + byteLength);
      } else if (byteLength < 256) {
        this.writeU8(217);
        this.writeU8(byteLength);
      } else if (byteLength < 65536) {
        this.writeU8(218);
        this.writeU16(byteLength);
      } else if (byteLength < 4294967296) {
        this.writeU8(219);
        this.writeU32(byteLength);
      } else {
        throw new Error("Too long string: " + byteLength + " bytes in UTF-8");
      }
    }
    encodeString(object) {
      let byteLength = utf8Count(object);
      this.ensureBufferSizeToWrite(5 + byteLength);
      this.writeStringHeader(byteLength);
      utf8Encode(object, this.bytes, this.pos);
      this.pos += byteLength;
    }
    encodeObject(object, depth) {
      let ext = this.extensionCodec.tryToEncode(object, this.context);
      if (ext != null) {
        this.encodeExtension(ext);
      } else if (Array.isArray(object)) {
        this.encodeArray(object, depth);
      } else if (ArrayBuffer.isView(object)) {
        this.encodeBinary(object);
      } else if (typeof object == "object") {
        this.encodeMap(object, depth);
      } else {
        throw new Error("Unrecognized object: " + Object.prototype.toString.apply(object));
      }
    }
    encodeBinary(object) {
      let size = object.byteLength;
      if (size < 256) {
        this.writeU8(196);
        this.writeU8(size);
      } else if (size < 65536) {
        this.writeU8(197);
        this.writeU16(size);
      } else if (size < 4294967296) {
        this.writeU8(198);
        this.writeU32(size);
      } else {
        throw new Error("Too large binary: " + size);
      }
      let bytes = ensureUint8Array(object);
      this.writeU8a(bytes);
    }
    encodeArray(object, depth) {
      let size = object.length;
      if (size < 16) {
        this.writeU8(144 + size);
      } else if (size < 65536) {
        this.writeU8(220);
        this.writeU16(size);
      } else if (size < 4294967296) {
        this.writeU8(221);
        this.writeU32(size);
      } else {
        throw new Error("Too large array: " + size);
      }
      for (let item of object) {
        this.doEncode(item, depth + 1);
      }
    }
    countWithoutUndefined(object, keys) {
      let count = 0;
      for (let key of keys) {
        if (object[key] !== undefined) {
          count++;
        }
      }
      return count;
    }
    encodeMap(object, depth) {
      let keys = Object.keys(object);
      if (this.sortKeys) {
        keys.sort();
      }
      let size = this.ignoreUndefined ? this.countWithoutUndefined(object, keys) : keys.length;
      if (size < 16) {
        this.writeU8(128 + size);
      } else if (size < 65536) {
        this.writeU8(222);
        this.writeU16(size);
      } else if (size < 4294967296) {
        this.writeU8(223);
        this.writeU32(size);
      } else {
        throw new Error("Too large map object: " + size);
      }
      for (let key of keys) {
        let value = object[key];
        if (!(this.ignoreUndefined && value === undefined)) {
          this.encodeString(key);
          this.doEncode(value, depth + 1);
        }
      }
    }
    encodeExtension(ext) {
      if (typeof ext.data == "function") {
        let data = ext.data(this.pos + 6);
        let size2 = data.length;
        if (size2 >= 4294967296) {
          throw new Error("Too large extension object: " + size2);
        }
        this.writeU8(201);
        this.writeU32(size2);
        this.writeI8(ext.type);
        this.writeU8a(data);
        return;
      }
      let size = ext.data.length;
      if (size === 1) {
        this.writeU8(212);
      } else if (size === 2) {
        this.writeU8(213);
      } else if (size === 4) {
        this.writeU8(214);
      } else if (size === 8) {
        this.writeU8(215);
      } else if (size === 16) {
        this.writeU8(216);
      } else if (size < 256) {
        this.writeU8(199);
        this.writeU8(size);
      } else if (size < 65536) {
        this.writeU8(200);
        this.writeU16(size);
      } else if (size < 4294967296) {
        this.writeU8(201);
        this.writeU32(size);
      } else {
        throw new Error("Too large extension object: " + size);
      }
      this.writeI8(ext.type);
      this.writeU8a(ext.data);
    }
    writeU8(value) {
      this.ensureBufferSizeToWrite(1);
      this.view.setUint8(this.pos, value);
      this.pos++;
    }
    writeU8a(values) {
      let size = values.length;
      this.ensureBufferSizeToWrite(size);
      this.bytes.set(values, this.pos);
      this.pos += size;
    }
    writeI8(value) {
      this.ensureBufferSizeToWrite(1);
      this.view.setInt8(this.pos, value);
      this.pos++;
    }
    writeU16(value) {
      this.ensureBufferSizeToWrite(2);
      this.view.setUint16(this.pos, value);
      this.pos += 2;
    }
    writeI16(value) {
      this.ensureBufferSizeToWrite(2);
      this.view.setInt16(this.pos, value);
      this.pos += 2;
    }
    writeU32(value) {
      this.ensureBufferSizeToWrite(4);
      this.view.setUint32(this.pos, value);
      this.pos += 4;
    }
    writeI32(value) {
      this.ensureBufferSizeToWrite(4);
      this.view.setInt32(this.pos, value);
      this.pos += 4;
    }
    writeF32(value) {
      this.ensureBufferSizeToWrite(4);
      this.view.setFloat32(this.pos, value);
      this.pos += 4;
    }
    writeF64(value) {
      this.ensureBufferSizeToWrite(8);
      this.view.setFloat64(this.pos, value);
      this.pos += 8;
    }
    writeU64(value) {
      this.ensureBufferSizeToWrite(8);
      setUint64(this.view, this.pos, value);
      this.pos += 8;
    }
    writeI64(value) {
      this.ensureBufferSizeToWrite(8);
      setInt64(this.view, this.pos, value);
      this.pos += 8;
    }
    writeBigUint64(value) {
      this.ensureBufferSizeToWrite(8);
      this.view.setBigUint64(this.pos, value);
      this.pos += 8;
    }
    writeBigInt64(value) {
      this.ensureBufferSizeToWrite(8);
      this.view.setBigInt64(this.pos, value);
      this.pos += 8;
    }
  }
  function msgpackEncode(value, options) {
    return new Encoder(options).encodeSharedRef(value);
  }
  var DEFAULT_MAX_KEY_LENGTH = 16;
  var DEFAULT_MAX_LENGTH_PER_KEY = 16;
  class CachedKeyDecoder {
    constructor(maxKeyLength = DEFAULT_MAX_KEY_LENGTH, maxLengthPerKey = DEFAULT_MAX_LENGTH_PER_KEY) {
      this.hit = 0;
      this.miss = 0;
      this.maxKeyLength = maxKeyLength;
      this.maxLengthPerKey = maxLengthPerKey;
      this.caches = [];
      for (let i = 0; i < this.maxKeyLength; i++) {
        this.caches.push([]);
      }
    }
    canBeCached(byteLength) {
      return byteLength > 0 && byteLength <= this.maxKeyLength;
    }
    find(bytes, inputOffset, byteLength) {
      let records = this.caches[byteLength - 1];
      t: for (let record of records) {
        let recordBytes = record.bytes;
        for (let j = 0; j < byteLength; j++) {
          if (recordBytes[j] !== bytes[inputOffset + j]) {
            continue t;
          }
        }
        return record.str;
      }
      return null;
    }
    store(bytes, value) {
      let records = this.caches[bytes.length - 1];
      let record = {
        bytes: bytes,
        str: value,
      };
      if (records.length >= this.maxLengthPerKey) {
        records[(Math.random() * records.length) | 0] = record;
      } else {
        records.push(record);
      }
    }
    decode(bytes, inputOffset, byteLength) {
      let cachedValue = this.find(bytes, inputOffset, byteLength);
      if (cachedValue != null) {
        this.hit++;
        return cachedValue;
      }
      this.miss++;
      let str = utf8DecodeJs(bytes, inputOffset, byteLength);
      let slicedCopyOfBytes = Uint8Array.prototype.slice.call(bytes, inputOffset, inputOffset + byteLength);
      this.store(slicedCopyOfBytes, str);
      return str;
    }
  }
  var STATE_ARRAY = "array";
  var STATE_MAP_KEY = "map_key";
  var STATE_MAP_VALUE = "map_value";
  var mapKeyConverter = (key) => {
    if (typeof key == "string" || typeof key == "number") {
      return key;
    }
    throw new DecodeError("The type of key must be string or number but " + typeof key);
  };
  class StackPool {
    constructor() {
      this.stack = [];
      this.stackHeadPosition = -1;
    }
    get length() {
      return this.stackHeadPosition + 1;
    }
    top() {
      return this.stack[this.stackHeadPosition];
    }
    pushArrayState(size) {
      let state = this.getUninitializedStateFromPool();
      state.type = STATE_ARRAY;
      state.position = 0;
      state.size = size;
      state.array = new Array(size);
    }
    pushMapState(size) {
      let state = this.getUninitializedStateFromPool();
      state.type = STATE_MAP_KEY;
      state.readCount = 0;
      state.size = size;
      state.map = {};
    }
    getUninitializedStateFromPool() {
      this.stackHeadPosition++;
      if (this.stackHeadPosition === this.stack.length) {
        let map = {
          type: undefined,
          size: 0,
          array: undefined,
          position: 0,
          readCount: 0,
          map: undefined,
          key: null,
        };
        this.stack.push(map);
      }
      return this.stack[this.stackHeadPosition];
    }
    release(state) {
      if (this.stack[this.stackHeadPosition] !== state) {
        throw new Error("Invalid stack state. Released state is not on top of the stack.");
      }
      if (state.type === STATE_ARRAY) {
        let partialState = state;
        partialState.size = 0;
        partialState.array = undefined;
        partialState.position = 0;
        partialState.type = undefined;
      }
      if (state.type === STATE_MAP_KEY || state.type === STATE_MAP_VALUE) {
        let partialState = state;
        partialState.size = 0;
        partialState.map = undefined;
        partialState.readCount = 0;
        partialState.type = undefined;
      }
      this.stackHeadPosition--;
    }
    reset() {
      this.stack.length = 0;
      this.stackHeadPosition = -1;
    }
  }
  var HEAD_BYTE_REQUIRED = -1;
  var EMPTY_VIEW = new DataView(new ArrayBuffer(0));
  var EMPTY_BYTES = new Uint8Array(EMPTY_VIEW.buffer);
  try {
    EMPTY_VIEW.getInt8(0);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw new Error(
        "This module is not supported in the current JavaScript engine because DataView does not throw RangeError on out-of-bounds access",
      );
    }
  }
  var MORE_DATA = new RangeError("Insufficient data");
  var sharedCachedKeyDecoder = new CachedKeyDecoder();
  class Decoder {
    constructor(options) {
      this.totalPos = 0;
      this.pos = 0;
      this.view = EMPTY_VIEW;
      this.bytes = EMPTY_BYTES;
      this.headByte = HEAD_BYTE_REQUIRED;
      this.stack = new StackPool();
      this.entered = false;
      this.extensionCodec = options?.extensionCodec ?? ExtensionCodec.defaultCodec;
      this.context = options?.context;
      this.useBigInt64 = options?.useBigInt64 ?? false;
      this.rawStrings = options?.rawStrings ?? false;
      this.maxStrLength = options?.maxStrLength ?? 0xffffffff;
      this.maxBinLength = options?.maxBinLength ?? 0xffffffff;
      this.maxArrayLength = options?.maxArrayLength ?? 0xffffffff;
      this.maxMapLength = options?.maxMapLength ?? 0xffffffff;
      this.maxExtLength = options?.maxExtLength ?? 0xffffffff;
      this.keyDecoder = options?.keyDecoder !== undefined ? options.keyDecoder : sharedCachedKeyDecoder;
      this.mapKeyConverter = options?.mapKeyConverter ?? mapKeyConverter;
    }
    clone() {
      return new Decoder({
        extensionCodec: this.extensionCodec,
        context: this.context,
        useBigInt64: this.useBigInt64,
        rawStrings: this.rawStrings,
        maxStrLength: this.maxStrLength,
        maxBinLength: this.maxBinLength,
        maxArrayLength: this.maxArrayLength,
        maxMapLength: this.maxMapLength,
        maxExtLength: this.maxExtLength,
        keyDecoder: this.keyDecoder,
      });
    }
    reinitializeState() {
      this.totalPos = 0;
      this.headByte = HEAD_BYTE_REQUIRED;
      this.stack.reset();
    }
    setBuffer(buffer) {
      let bytes = ensureUint8Array(buffer);
      this.bytes = bytes;
      this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      this.pos = 0;
    }
    appendBuffer(buffer) {
      if (this.headByte === HEAD_BYTE_REQUIRED && !this.hasRemaining(1)) {
        this.setBuffer(buffer);
      } else {
        let remainingData = this.bytes.subarray(this.pos);
        let newData = ensureUint8Array(buffer);
        let newBuffer = new Uint8Array(remainingData.length + newData.length);
        newBuffer.set(remainingData);
        newBuffer.set(newData, remainingData.length);
        this.setBuffer(newBuffer);
      }
    }
    hasRemaining(size) {
      return this.view.byteLength - this.pos >= size;
    }
    createExtraByteError(posToShow) {
      let { view: view, pos: pos } = this;
      return new RangeError(
        "Extra " + (view.byteLength - pos) + " of " + view.byteLength + " byte(s) found at buffer[" + posToShow + "]",
      );
    }
    decode(buffer) {
      if (this.entered) {
        return this.clone().decode(buffer);
      }
      try {
        this.entered = true;
        this.reinitializeState();
        this.setBuffer(buffer);
        let object = this.doDecodeSync();
        if (this.hasRemaining(1)) {
          throw this.createExtraByteError(this.pos);
        }
        return object;
      } finally {
        this.entered = false;
      }
    }
    *decodeMulti(buffer) {
      if (this.entered) {
        yield* this.clone().decodeMulti(buffer);
        return;
      }
      try {
        for (this.entered = true, this.reinitializeState(), this.setBuffer(buffer); this.hasRemaining(1);) {
          yield this.doDecodeSync();
        }
      } finally {
        this.entered = false;
      }
    }
    async decodeAsync(stream) {
      if (this.entered) {
        return this.clone().decodeAsync(stream);
      }
      try {
        this.entered = true;
        let decoded = false;
        let object;
        for await (let buffer of stream) {
          if (decoded) {
            throw ((this.entered = false), this.createExtraByteError(this.totalPos));
          }
          this.appendBuffer(buffer);
          try {
            object = this.doDecodeSync();
            decoded = true;
          } catch (err) {
            if (!(err instanceof RangeError)) {
              throw err;
            }
          }
          this.totalPos += this.pos;
        }
        if (decoded) {
          if (this.hasRemaining(1)) {
            throw this.createExtraByteError(this.totalPos);
          }
          return object;
        }
        let { headByte: headByte, pos: pos, totalPos: totalPos } = this;
        throw new RangeError(
          "Insufficient data in parsing " +
            prettyByte(headByte) +
            " at " +
            totalPos +
            " (" +
            pos +
            " in the current buffer)",
        );
      } finally {
        this.entered = false;
      }
    }
    decodeArrayStream(stream) {
      return this.decodeMultiAsync(stream, true);
    }
    decodeStream(stream) {
      return this.decodeMultiAsync(stream, false);
    }
    async *decodeMultiAsync(stream, isArray) {
      if (this.entered) {
        yield* this.clone().decodeMultiAsync(stream, isArray);
        return;
      }
      try {
        this.entered = true;
        let isArrayHeaderRequired = isArray;
        let arrayItemsLeft = -1;
        for await (let buffer of stream) {
          if (isArray && arrayItemsLeft === 0) {
            throw this.createExtraByteError(this.totalPos);
          }
          this.appendBuffer(buffer);
          if (isArrayHeaderRequired) {
            arrayItemsLeft = this.readArraySize();
            isArrayHeaderRequired = false;
            this.complete();
          }
          try {
            while ((yield this.doDecodeSync(), --arrayItemsLeft !== 0)) {}
          } catch (err) {
            if (!(err instanceof RangeError)) {
              throw err;
            }
          }
          this.totalPos += this.pos;
        }
      } finally {
        this.entered = false;
      }
    }
    doDecodeSync() {
      t: for (;;) {
        let headByte = this.readHeadByte();
        let object;
        if (headByte >= 224) {
          object = headByte - 256;
        } else if (headByte < 192) {
          if (headByte < 128) {
            object = headByte;
          } else if (headByte < 144) {
            let size = headByte - 128;
            if (size !== 0) {
              this.pushMapState(size);
              this.complete();
              continue t;
            } else {
              object = {};
            }
          } else if (headByte < 160) {
            let size = headByte - 144;
            if (size !== 0) {
              this.pushArrayState(size);
              this.complete();
              continue t;
            } else {
              object = [];
            }
          } else {
            let byteLength = headByte - 160;
            object = this.decodeString(byteLength, 0);
          }
        } else if (headByte === 192) {
          object = null;
        } else if (headByte === 194) {
          object = false;
        } else if (headByte === 195) {
          object = true;
        } else if (headByte === 202) {
          object = this.readF32();
        } else if (headByte === 203) {
          object = this.readF64();
        } else if (headByte === 204) {
          object = this.readU8();
        } else if (headByte === 205) {
          object = this.readU16();
        } else if (headByte === 206) {
          object = this.readU32();
        } else if (headByte === 207) {
          if (this.useBigInt64) {
            object = this.readU64AsBigInt();
          } else {
            object = this.readU64();
          }
        } else if (headByte === 208) {
          object = this.readI8();
        } else if (headByte === 209) {
          object = this.readI16();
        } else if (headByte === 210) {
          object = this.readI32();
        } else if (headByte === 211) {
          if (this.useBigInt64) {
            object = this.readI64AsBigInt();
          } else {
            object = this.readI64();
          }
        } else if (headByte === 217) {
          let byteLength = this.lookU8();
          object = this.decodeString(byteLength, 1);
        } else if (headByte === 218) {
          let byteLength = this.lookU16();
          object = this.decodeString(byteLength, 2);
        } else if (headByte === 219) {
          let byteLength = this.lookU32();
          object = this.decodeString(byteLength, 4);
        } else if (headByte === 220) {
          let size = this.readU16();
          if (size !== 0) {
            this.pushArrayState(size);
            this.complete();
            continue t;
          } else {
            object = [];
          }
        } else if (headByte === 221) {
          let size = this.readU32();
          if (size !== 0) {
            this.pushArrayState(size);
            this.complete();
            continue t;
          } else {
            object = [];
          }
        } else if (headByte === 222) {
          let size = this.readU16();
          if (size !== 0) {
            this.pushMapState(size);
            this.complete();
            continue t;
          } else {
            object = {};
          }
        } else if (headByte === 223) {
          let size = this.readU32();
          if (size !== 0) {
            this.pushMapState(size);
            this.complete();
            continue t;
          } else {
            object = {};
          }
        } else if (headByte === 196) {
          let size = this.lookU8();
          object = this.decodeBinary(size, 1);
        } else if (headByte === 197) {
          let size = this.lookU16();
          object = this.decodeBinary(size, 2);
        } else if (headByte === 198) {
          let size = this.lookU32();
          object = this.decodeBinary(size, 4);
        } else if (headByte === 212) {
          object = this.decodeExtension(1, 0);
        } else if (headByte === 213) {
          object = this.decodeExtension(2, 0);
        } else if (headByte === 214) {
          object = this.decodeExtension(4, 0);
        } else if (headByte === 215) {
          object = this.decodeExtension(8, 0);
        } else if (headByte === 216) {
          object = this.decodeExtension(16, 0);
        } else if (headByte === 199) {
          let size = this.lookU8();
          object = this.decodeExtension(size, 1);
        } else if (headByte === 200) {
          let size = this.lookU16();
          object = this.decodeExtension(size, 2);
        } else if (headByte === 201) {
          let size = this.lookU32();
          object = this.decodeExtension(size, 4);
        } else {
          throw new DecodeError("Unrecognized type byte: " + prettyByte(headByte));
        }
        this.complete();
        let stack = this.stack;
        while (stack.length > 0) {
          let state = stack.top();
          if (state.type === STATE_ARRAY) {
            state.array[state.position] = object;
            state.position++;
            if (state.position === state.size) {
              object = state.array;
              stack.release(state);
            } else {
              continue t;
            }
          } else if (state.type === STATE_MAP_KEY) {
            if (object === "__proto__") {
              throw new DecodeError("The key __proto__ is not allowed");
            }
            state.key = this.mapKeyConverter(object);
            state.type = STATE_MAP_VALUE;
            continue t;
          } else {
            state.map[state.key] = object;
            state.readCount++;
            if (state.readCount === state.size) {
              object = state.map;
              stack.release(state);
            } else {
              state.key = null;
              state.type = STATE_MAP_KEY;
              continue t;
            }
          }
        }
        return object;
      }
    }
    readHeadByte() {
      if (this.headByte === HEAD_BYTE_REQUIRED) {
        this.headByte = this.readU8();
      }
      return this.headByte;
    }
    complete() {
      this.headByte = HEAD_BYTE_REQUIRED;
    }
    readArraySize() {
      let headByte = this.readHeadByte();
      switch (headByte) {
        case 220:
          return this.readU16();
        case 221:
          return this.readU32();
        default: {
          if (headByte < 160) {
            return headByte - 144;
          }
          throw new DecodeError("Unrecognized array type byte: " + prettyByte(headByte));
        }
      }
    }
    pushMapState(size) {
      if (size > this.maxMapLength) {
        throw new DecodeError(
          "Max length exceeded: map length (" + size + ") > maxMapLengthLength (" + this.maxMapLength + ")",
        );
      }
      this.stack.pushMapState(size);
    }
    pushArrayState(size) {
      if (size > this.maxArrayLength) {
        throw new DecodeError(
          "Max length exceeded: array length (" + size + ") > maxArrayLength (" + this.maxArrayLength + ")",
        );
      }
      this.stack.pushArrayState(size);
    }
    decodeString(byteLength, headerOffset) {
      return !this.rawStrings || this.stateIsMapKey()
        ? this.decodeUtf8String(byteLength, headerOffset)
        : this.decodeBinary(byteLength, headerOffset);
    }
    decodeUtf8String(byteLength, headerOffset) {
      if (byteLength > this.maxStrLength) {
        throw new DecodeError(
          "Max length exceeded: UTF-8 byte length (" + byteLength + ") > maxStrLength (" + this.maxStrLength + ")",
        );
      }
      if (this.bytes.byteLength < this.pos + headerOffset + byteLength) {
        throw MORE_DATA;
      }
      let offset = this.pos + headerOffset;
      let object;
      if (this.stateIsMapKey() && this.keyDecoder?.canBeCached(byteLength)) {
        object = this.keyDecoder.decode(this.bytes, offset, byteLength);
      } else {
        object = utf8Decode(this.bytes, offset, byteLength);
      }
      this.pos += headerOffset + byteLength;
      return object;
    }
    stateIsMapKey() {
      return this.stack.length > 0 ? this.stack.top().type === STATE_MAP_KEY : false;
    }
    decodeBinary(byteLength, headOffset) {
      if (byteLength > this.maxBinLength) {
        throw new DecodeError(
          "Max length exceeded: bin length (" + byteLength + ") > maxBinLength (" + this.maxBinLength + ")",
        );
      }
      if (!this.hasRemaining(byteLength + headOffset)) {
        throw MORE_DATA;
      }
      let offset = this.pos + headOffset;
      let object = this.bytes.subarray(offset, offset + byteLength);
      this.pos += headOffset + byteLength;
      return object;
    }
    decodeExtension(size, headOffset) {
      if (size > this.maxExtLength) {
        throw new DecodeError(
          "Max length exceeded: ext length (" + size + ") > maxExtLength (" + this.maxExtLength + ")",
        );
      }
      let extType = this.view.getInt8(this.pos + headOffset);
      let data = this.decodeBinary(size, headOffset + 1);
      return this.extensionCodec.decode(data, extType, this.context);
    }
    lookU8() {
      return this.view.getUint8(this.pos);
    }
    lookU16() {
      return this.view.getUint16(this.pos);
    }
    lookU32() {
      return this.view.getUint32(this.pos);
    }
    readU8() {
      let value = this.view.getUint8(this.pos);
      this.pos++;
      return value;
    }
    readI8() {
      let value = this.view.getInt8(this.pos);
      this.pos++;
      return value;
    }
    readU16() {
      let value = this.view.getUint16(this.pos);
      this.pos += 2;
      return value;
    }
    readI16() {
      let value = this.view.getInt16(this.pos);
      this.pos += 2;
      return value;
    }
    readU32() {
      let value = this.view.getUint32(this.pos);
      this.pos += 4;
      return value;
    }
    readI32() {
      let value = this.view.getInt32(this.pos);
      this.pos += 4;
      return value;
    }
    readU64() {
      let value = getUint64(this.view, this.pos);
      this.pos += 8;
      return value;
    }
    readI64() {
      let value = getInt64(this.view, this.pos);
      this.pos += 8;
      return value;
    }
    readU64AsBigInt() {
      let value = this.view.getBigUint64(this.pos);
      this.pos += 8;
      return value;
    }
    readI64AsBigInt() {
      let value = this.view.getBigInt64(this.pos);
      this.pos += 8;
      return value;
    }
    readF32() {
      let value = this.view.getFloat32(this.pos);
      this.pos += 4;
      return value;
    }
    readF64() {
      let value = this.view.getFloat64(this.pos);
      this.pos += 8;
      return value;
    }
  }

  // ===== WebSocket interception and packet manipulation (spinbot, invisibility, crash, loadout) =====
  var openSockets = [];
  var socketSessionId = null;
  var CRASH_TARGET_PREFIX = [13, 60, 133, 161, 120, 202];
  var CRASH_CORRUPT_OFFSETS = [13, 14];
  var gameSocket = null;
  var rawSend = null;
  var lastMovePacket = {
    x: 0,
    y: 0,
    z: 0,
    ry: 0,
    n: 0,
  };
  var spinAngle = 0;
  var WEAPON_NAMES = [
    "Assault Rifle",
    "Burst Rifle",
    "Handgun",
    "Sniper",
    "Rocket Launcher",
    "Stabber",
    "Shawty",
    "Bow",
    "AK-47",
    "Minigun",
    "Shield",
    "Submachine Gun",
    "Energy Pistols",
    "Fists",
    "Grenade",
    "Revolver",
    "Gunblade",
    "Paintball Gun",
    "Veck Toy",
    "Tec-9",
    "Scythe",
    "Split Fang",
    "Watergun",
    "Shotgun",
    "Cardboard Sniper",
    "Snowball Gun",
    "Flaregun",
    "War Horn",
    "Grenade Launcher",
    "Karambit",
    "Shurikens",
    "Katana",
    "Flash",
    "Smoke",
    "Spray",
    "War Axe",
    "Exogun",
    "Slingshot",
    "Flamethrower",
    "Energy Rifle",
  ];
  function applyLoadout() {
    let primaryId = WEAPON_NAMES.indexOf(config.loadout.primary);
    let secondaryId = WEAPON_NAMES.indexOf(config.loadout.secondary);
    let meleeId = WEAPON_NAMES.indexOf(config.loadout.melee);
    let grenadeId = WEAPON_NAMES.indexOf(config.loadout.grenades);
    broadcastPacket([13, 49, 148, primaryId, secondaryId, meleeId, grenadeId]);
  }
  function broadcastPacket(bytes) {
    let packet = Uint8Array.from(bytes);
    openSockets.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(packet);
      }
    });
  }
  function startsWithBytes(bytes, prefix) {
    return bytes.length >= prefix.length && prefix.every((byte, indexValue) => bytes[indexValue] === byte);
  }
  function installWebSocketHook() {
    let OriginalWebSocket = window.WebSocket;
    window.WebSocket = class extends OriginalWebSocket {
      constructor(...args) {
        super(...args);
        openSockets.push(this);
        socketSessionId = extractSessionId(this.url);
        gameSocket = this;
        let originalSend = this.send;
        rawSend = (data) => originalSend.call(this, data);
        let forgetSocket = () => {
          let socketIndex = openSockets.indexOf(this);
          if (socketIndex !== -1) {
            openSockets.splice(socketIndex, 1);
          }
        };
        this.addEventListener("close", forgetSocket);
        this.addEventListener("error", forgetSocket);
        this.send = function (data) {
          try {
            if (data instanceof ArrayBuffer) {
              let bytes = new Uint8Array(data);
              if (bytes[0] === 13 && bytes[1] === 60) {
                let movePacket = msgpackDecode(bytes.slice(2));
                lastMovePacket.x = movePacket.x;
                lastMovePacket.y = movePacket.y;
                lastMovePacket.z = movePacket.z;
                lastMovePacket.n = movePacket.n;
                lastMovePacket.ry = movePacket.ry;
                if (config.rage.spinbot) {
                  spinAngle = (spinAngle + 120) % 360;
                  movePacket.ry = spinAngle;
                  let encoded = msgpackEncode(movePacket);
                  let packet = new Uint8Array(2 + encoded.length);
                  packet[0] = 13;
                  packet[1] = 60;
                  packet.set(encoded, 2);
                  rawSend(packet);
                  return;
                }
                if (config.rage.invisibility) {
                  movePacket.z = (movePacket.z + 10) & 255;
                  let encoded = msgpackEncode(movePacket);
                  let packet = new Uint8Array(2 + encoded.length);
                  packet[0] = 13;
                  packet[1] = 60;
                  packet.set(encoded, 2);
                  rawSend(packet);
                  return;
                }
              }
              if (startsWithBytes(bytes, CRASH_TARGET_PREFIX)) {
                let patched = new Uint8Array(bytes);
                CRASH_CORRUPT_OFFSETS.forEach((offset) => {
                  if (config.rage.crash && offset < patched.length) {
                    console.log("fail1");
                    patched[offset] = (patched[offset] + 3236) & 255;
                  }
                });
                data = patched.buffer;
              }
            }
          } catch (err) {
            console.error("WebSocket Send Error:", err);
          }
          return originalSend.call(this, data);
        };
      }
    };
  }
  function sendSpinbotPacket(step = 120) {
    if (!gameSocket || !rawSend) {
      return;
    }
    spinAngle = (spinAngle + step) % 360;
    let movePacket = {
      ...lastMovePacket,
      ry: spinAngle,
    };
    let encoded = msgpackEncode(movePacket);
    let packet = new Uint8Array(2 + encoded.length);
    packet[0] = 13;
    packet[1] = 60;
    packet.set(encoded, 2);
    rawSend(packet);
  }
  function extractSessionId(url) {
    let match = url.match(/sessionId=([^&]+)/i);
    return match && match[1];
  }

  // ===== ESP / aimbot state and canvas drawing helpers =====
  var BONE_PATHS = {
    Hips: "Global/Root/gfx/Animated/char/root",
    SpineLower: "Global/Root/gfx/Animated/char/root/spine_b",
    SpineUpper: "Global/Root/gfx/Animated/char/root/spine_b/spine_c",
    Head: "Global/Root/gfx/Animated/char/root/spine_b/spine_c/head",
    LeftUpperLeg: "Global/Root/gfx/Animated/char/root/spine_b/LeftLeg",
    LeftLowerLeg: "Global/Root/gfx/Animated/char/root/spine_b/LeftLeg/LeftFoot",
    RightUpperLeg: "Global/Root/gfx/Animated/char/root/spine_b/RightLeg",
    RightLowerLeg: "Global/Root/gfx/Animated/char/root/spine_b/RightLeg/RightFoot",
    LeftUpperArm: "Global/Root/gfx/Animated/char/root/spine_b/spine_c/arm.L",
    LeftHand: "Global/Root/gfx/Animated/char/root/spine_b/spine_c/arm.L/hand.L",
    RightUpperArm: "Global/Root/gfx/Animated/char/root/spine_b/spine_c/arm.R",
    RightHand: "Global/Root/gfx/Animated/char/root/spine_b/spine_c/arm.R/hand.R",
    BackAttachment: "Global/Root/gfx/Animated/char/root/spine_b/spine_c/back_parent",
    Hat: "Global/Root/gfx/Animated/char/root/spine_b/spine_c/head/hat_parent",
  };
  var SKELETON_LINKS = [
    ["Hips", "SpineLower"],
    ["SpineLower", "SpineUpper"],
    ["SpineUpper", "Head"],
    ["Hips", "LeftUpperLeg"],
    ["LeftUpperLeg", "LeftLowerLeg"],
    ["Hips", "RightUpperLeg"],
    ["RightUpperLeg", "RightLowerLeg"],
    ["SpineUpper", "LeftUpperArm"],
    ["LeftUpperArm", "LeftHand"],
    ["SpineUpper", "RightUpperArm"],
    ["RightUpperArm", "RightHand"],
  ];
  var onScreenTargets = [];
  var crosshairTarget = null;
  var aimTarget = null;
  var aimTargetScreenDist = Infinity;
  var lockedTarget = null;
  var lastTargetSwitchTime = 0;
  var stickyTarget = null;
  var stickyTargetScreenDist = Infinity;
  var NO_TARGET_DIST = Infinity;
  function rainbowColor() {
    return "hsl(" + ((Date.now() * 0.05) % 360) + ", 100%, 50%)";
  }
  function worldToScreen(canvas, worldPosPtr, screen) {
    let screenPointPtr = Camera.main.WorldToScreenPoint_position(worldPosPtr);
    let viewportPointPtr = Camera.main.ScreenToViewportPoint(screenPointPtr);
    screen = Vec3.readFrom(viewportPointPtr);
    screen.x *= window.innerWidth;
    screen.y *= window.innerHeight;
    screen.y = canvas.height - screen.y;
    unityInstance.Module.asm.free(screenPointPtr);
    unityInstance.Module.asm.free(viewportPointPtr);
    return screen;
  }
  function drawHealthBar(headScreen, feetScreen, ctx2d, health, maxHealth = 150, barWidth = 4) {
    let boxHeight = feetScreen.y - headScreen.y;
    let boxWidth = boxHeight * 0.6;
    let barX = headScreen.x - boxWidth / 2 - barWidth + -5;
    let barY = headScreen.y;
    health = Math.max(0, Math.min(health, maxHealth));
    let healthRatio = health / maxHealth;
    let filledHeight = boxHeight * healthRatio;
    ctx2d.beginPath();
    ctx2d.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx2d.fillRect(barX, barY, barWidth, boxHeight);
    ctx2d.beginPath();
    ctx2d.fillStyle = health > 60 ? "#00ff00" : health > 30 ? "#ffff00" : "#ff0000";
    ctx2d.fillRect(barX, barY + (boxHeight - filledHeight), barWidth, filledHeight);
  }
  function drawInfoLines(ctx2d, x, y, lines, scale, direction = "up") {
    let textX = Math.round(x) + 0.5 + 20;
    let cursorY = y;
    ctx2d.textAlign = "center";
    ctx2d.textBaseline = "middle";
    for (let line of lines) {
      let fontSize = Math.round(line.size * scale);
      ctx2d.font = `${fontSize}px sans-serif`;
      ctx2d.fillStyle = line.color;
      let textY = Math.round(cursorY) + 0.5;
      ctx2d.strokeStyle = "black";
      ctx2d.lineWidth = 2;
      ctx2d.strokeText(line.text, textX, textY);
      ctx2d.fillText(line.text, textX, textY);
      cursorY += direction === "up" ? -fontSize : fontSize;
    }
  }
  function normalizeAngle(angle) {
    angle %= 360;
    if (angle > 180) {
      angle -= 360;
    }
    if (angle < -180) {
      angle += 360;
    }
    return angle;
  }
  window.offsetY = 0;
  function lerpAngle(from, to, factor) {
    let diff = normalizeAngle(to - from);
    return normalizeAngle(from + diff * factor);
  }
  function drawCornerBox(headScreen, feetScreen, ctx2d, color, thickness = 2, outline = false) {
    function line(x1, y1, x2, y2, lineColor, lineWidth) {
      ctx2d.beginPath();
      ctx2d.moveTo(x1, y1);
      ctx2d.lineTo(x2, y2);
      ctx2d.strokeStyle = color;
      ctx2d.lineWidth = lineWidth;
      ctx2d.stroke();
    }
    let height = feetScreen.y - headScreen.y;
    let width = height * 0.6;
    let left = headScreen.x - width / 2;
    let top = headScreen.y;
    let cornerWidth = width / 4;
    let cornerHeight = cornerWidth;
    if (outline) {
      let outlineColor = "black";
      let outlineWidth = thickness + 2;
      line(left - 1, top - 1, left - 1, top + cornerHeight + 1, outlineColor, outlineWidth);
      line(left - 1, top - 1, left + cornerWidth + 1, top - 1, outlineColor, outlineWidth);
      line(left + width + 1, top - 1, left + width + 1, top + cornerHeight + 1, outlineColor, outlineWidth);
      line(left + width - cornerWidth - 1, top - 1, left + width + 1, top - 1, outlineColor, outlineWidth);
      line(left - 1, top + height - cornerHeight - 1, left - 1, top + height + 1, outlineColor, outlineWidth);
      line(left - 1, top + height + 1, left + cornerWidth + 1, top + height + 1, outlineColor, outlineWidth);
      line(
        left + width + 1,
        top + height - cornerHeight - 1,
        left + width + 1,
        top + height + 1,
        outlineColor,
        outlineWidth,
      );
      line(
        left + width - cornerWidth - 1,
        top + height + 1,
        left + width + 1,
        top + height + 1,
        outlineColor,
        outlineWidth,
      );
    }
    line(left, top, left, top + cornerHeight, color, thickness);
    line(left, top, left + cornerWidth, top, color, thickness);
    line(left + width, top, left + width - cornerWidth, top, color, thickness);
    line(left + width, top, left + width, top + cornerHeight, color, thickness);
    line(left, top + height, left + cornerWidth, top + height, color, thickness);
    line(left, top + height, left, top + height - cornerHeight, color, thickness);
    line(left + width, top + height, left + width - cornerWidth, top + height, color, thickness);
    line(left + width, top + height, left + width, top + height - cornerHeight, color, thickness);
  }
  function drawFovCircle(ctx2d, radius, color, lineWidth = 2) {
    ctx2d.beginPath();
    ctx2d.arc(window.innerWidth / 2, window.innerHeight / 2, radius, 0, Math.PI * 2);
    ctx2d.strokeStyle = color;
    ctx2d.lineWidth = lineWidth;
    ctx2d.stroke();
  }
  function drawLine(ctx2d, from, to, color = "red", lineWidth = 2) {
    ctx2d.beginPath();
    ctx2d.moveTo(from.x, from.y);
    ctx2d.lineTo(to.x, to.y);
    ctx2d.strokeStyle = color;
    ctx2d.lineWidth = lineWidth;
    ctx2d.stroke();
  }

  // Unused aliases / values that exist in the original code.
  var unusedGunAlias = Gun;
  var unusedColyBehaviourAlias = ColyBehaviour;
  var unusedWorldGrenadeAlias = WorldGrenade;

  // ===== Player tracking, game-method hooks and player commands =====
  var lastTriggerbotShotTime = 0;
  var unusedNull1 = null;
  var localGunDamage = 0;
  var unusedColyShooterAlias = ColyShooter;
  var unusedColyBehaviourAlias2 = ColyBehaviour;
  var unusedDeadCameraAlias = DeadCamera;
  var unusedNeckControllerAlias = NeckController;
  var unusedComponentAlias = Component;
  var unusedTransformAlias = Transform;
  var unusedNetworkManagerAlias = NetworkManager;
  var unusedMatchmake3DBoxAlias = Matchmake3DBox;
  var unusedHornAlias = Horn;
  var localShooterPtr = null;
  var players = [];
  var characterCameraPtr = null;
  var localPlayer = null;
  var originalTeamIndex = null;
  var unusedNull2 = null;
  window.others = players;
  function godModeEveryone() {
    hitpos = Vec3.zero().createPtr();
    players.forEach((player) => {
      new ColyShooter(player.shooter).SendRPCShoot(ctx.createMstr(player.sessionId), hitpos, 4, -99999999, null, false);
    });
  }
  function godModePlayerByName(name = "") {
    if (name === "") {
      for (let listedPlayer of players) {
        console.log(listedPlayer.name);
      }
      return;
    }
    let player = players.find((candidate) => candidate.name === name);
    if (player) {
      hitpos = Vec3.zero().createPtr();
      new ColyShooter(player.shooter).SendRPCShoot(ctx.createMstr(player.sessionId), hitpos, 4, -99999999, null, false);
    } else {
      console.log('Player "' + name + '" not found.');
    }
  }
  function installPlayerHooks() {
    let lastKillAllTime = 0;
    let KILL_ALL_COOLDOWN_MS = 1500;
    window.ctx.hookPrefix(
      {
        typeName: "ColyShooter",
        methodName: "Update",
        params: ["i32", "i32"],
      },
      (shooterPtr) => {
        let nowMs = performance.now();
        if (!(nowMs - lastKillAllTime < KILL_ALL_COOLDOWN_MS)) {
          if (new ColyBehaviour(shooterPtr).IsMine) {
            localShooterPtr = shooterPtr;
            let transform = new Component(shooterPtr).transform;
            let forwardPtr = transform.forward;
            let position = Vec3.readFrom(transform.position);
            localPlayer = {
              name: new ColyBehaviour(shooterPtr).colyView.Nickname.mstr(),
              sessionId: new ColyBehaviour(shooterPtr).colyView.sessionId,
              shooter: shooterPtr,
              pos: position,
              transform: transform,
              team: new ColyShooter(shooterPtr).colyTeamMember,
              forward: Vec3.readFrom(forwardPtr),
            };
            window.myplayer = localPlayer;
            if (originalTeamIndex === null) {
              originalTeamIndex = localPlayer.team.teamIndex;
            }
            if (config.rage.friendlyfire) {
              localPlayer.team.HandleTeamChange(-1, localPlayer.team.teamIndex);
            } else if (localPlayer.team.teamIndex !== originalTeamIndex) {
              localPlayer.team.HandleTeamChange(originalTeamIndex, localPlayer.team.teamIndex);
            }
          } else {
            if (config.rage.killall) {
              new ColyShooter(shooterPtr).CommitSuicide();
              lastKillAllTime = nowMs;
            }
            let colyView = new ColyBehaviour(shooterPtr).colyView;
            let transform = new Component(shooterPtr).transform;
            let position = Vec3.readFrom(transform.position);
            let playerIndex = players.findIndex((player) => player.sessionId === colyView.sessionId);
            if (config.rage.noshield) {
              new ColyShooter(shooterPtr).ChangeGun(0);
            }
            if (playerIndex === -1) {
              players.push({
                name: colyView.Nickname.mstr().replace(/<[^>]*>/g, ""),
                sessionId: colyView.sessionId,
                shooter: shooterPtr,
                status: "alive",
                pos: position,
                transform: transform,
                colyview: colyView,
              });
              menu.updatePlayerList(playersSection, players, onPlayerListAction);
            } else {
              players[playerIndex].pos = position;
              players[playerIndex].shooter = shooterPtr;
              if (players[playerIndex].status !== "alive") {
                players[playerIndex].status = "alive";
              }
            }
          }
        }
      },
    );
    window.ctx.hookPrefix(
      {
        typeName: "ColyShooter",
        methodName: "OnDisable",
        params: ["i32", "i32"],
      },
      (shooterPtr) => {
        if (new ColyBehaviour(shooterPtr).IsMine) {
          localShooterPtr = null;
        }
        let colyView = new ColyBehaviour(shooterPtr).colyView;
        let playerIndex = players.findIndex((player) => player.sessionId === colyView.sessionId);
        if (playerIndex !== -1) {
          let nickname = ctx
            .call("NetworkManager", "NickNameOf", [players[playerIndex].sessionId])
            .mstr()
            .replace(/<[^>]*>/g, "");
          if (nickname !== "Player" && nickname !== "Server") {
            players[playerIndex].status = "dead";
          } else {
            players.splice(playerIndex, 1);
          }
          menu.updatePlayerList(playersSection, players, onPlayerListAction);
        }
      },
    );
    let isOwnReplay = false;
    window.ctx.hookPrefix(
      {
        typeName: "ColyShooter",
        methodName: "SendRPCShoot",
        params: ["i32", "i32", "i32", "i32", "i32", "i32", "i32", "i32"],
      },
      (shooterPtr, targetSessionId, hitPosition, shotArg2, damagePtr, shotArg4, shotArg5) => {
        if (isOwnReplay) {
          isOwnReplay = false;
          return;
        }
        if (config.rage.aimbottype === "Magic Bullet" && config.rage.aimbot && aimTarget) {
          hitPosition = aimTarget.pos;
          targetSessionId = ctx.createMstr(aimTarget.sessionId);
        }
        if (crosshairTarget && config.rage.shootthroughwalls && targetSessionId.mstr() === "") {
          targetSessionId = ctx.createMstr(crosshairTarget.sessionId);
        }
        let newTargetId = targetSessionId;
        let newHitPosition = hitPosition;
        let damage = damagePtr.val();
        if (config.rage.bulletshitrandom && targetSessionId.mstr() === "") {
          let randomPlayer = players[Math.floor(Math.random() * players.length)];
          newTargetId = ctx.createMstr(randomPlayer.sessionId);
          newHitPosition = randomPlayer.pos.createPtr();
          shotArg2 = 4;
        }
        if (config.rage.oneshot) {
          damage = 150;
        } else if (config.rage.damage !== 0) {
          damage = config.rage.damage;
        }
        isOwnReplay = true;
        if (damage <= 0) {
          damage = localGunDamage;
        }
        new ColyShooter(shooterPtr).SendRPCShoot(newTargetId, newHitPosition, shotArg2, damage, shotArg4, shotArg5);
        return false;
      },
    );
    window.ctx.hookPrefix(
      {
        typeName: "AFKManager",
        methodName: "KickAFK",
        params: ["i32", "i32"],
      },
      (afkManagerPtr) => false,
    );
    window.ctx.hookPrefix(
      {
        typeName: "Holder",
        methodName: "Start",
        params: ["i32", "i32"],
      },
      (holderPtr) => {
        let stringArray = holderPtr.readField(20, "i32").readField(12, "i32");
        let count = Il2CppArray.GetLength(stringArray);
        for (let i = 0; i < count; i++) {
          let masked = Il2CppArray.GetValue(stringArray, i)
            .mstr()
            .split("")
            .map(() => "@")
            .join("");
          Il2CppArray.SetValue(stringArray, i, ctx.createMstr(masked));
        }
      },
    );
    window.ctx.hookPrefix(
      {
        typeName: "DeadCamera",
        methodName: "Update",
        params: ["i32", "i32"],
      },
      (deadCameraPtr) => {
        if (config.rage.instantrespawn) {
          new DeadCamera(deadCameraPtr).Respawn();
        }
      },
    );
    window.ctx.hookPrefix(
      {
        typeName: "NeckController",
        methodName: "LateUpdate",
        params: ["i32", "i32"],
      },
      (neckControllerPtr) => {
        if (config.rage.neckrotation !== 0) {
          new NeckController(neckControllerPtr).neckRotation = config.rage.neckrotation;
        }
      },
    );
    window.ctx.hookPrefix(
      {
        typeName: "KinematicCharacterController.Examples.CharacterCamera",
        methodName: "Update",
        params: ["i32", "i32"],
      },
      (cameraPtr) => {
        characterCameraPtr = cameraPtr;
      },
    );
  }

  // ===== Keyboard / mouse state used for hotkeys and the aim key =====
  var keysDown = {};
  var mouseButtons = {
    LeftMouse: false,
    RightMouse: false,
    MiddleMouse: false,
    BackMouse: false,
    ForwardMouse: false,
  };
  window.addEventListener("keydown", function (event) {
    keysDown[event.key] = true;
    keysDown[event.code] = true;
  });
  window.addEventListener("keyup", function (event) {
    keysDown[event.key] = false;
    keysDown[event.code] = false;
  });
  window.addEventListener("mousedown", function (event) {
    switch (event.button) {
      case 0:
        mouseButtons.LeftMouse = true;
        break;
      case 1:
        mouseButtons.MiddleMouse = true;
        break;
      case 2:
        mouseButtons.RightMouse = true;
        break;
      case 3:
        mouseButtons.BackMouse = true;
        event.preventDefault();
        break;
      case 4:
        mouseButtons.ForwardMouse = true;
        event.preventDefault();
        break;
    }
  });
  window.addEventListener("mouseup", function (event) {
    switch (event.button) {
      case 0:
        mouseButtons.LeftMouse = false;
        break;
      case 1:
        mouseButtons.MiddleMouse = false;
        break;
      case 2:
        mouseButtons.RightMouse = false;
        break;
      case 3:
        mouseButtons.BackMouse = false;
        break;
      case 4:
        mouseButtons.ForwardMouse = false;
        break;
    }
  });
  function onPlayerListAction(player, action, button) {
    console.log("Clicked " + action + " on " + player.name);
    if (action === "Kill") {
      new ColyShooter(player.shooter).CommitSuicide();
    }
    if (action === "TP To") {
      let teleportPos = new Vec3(player.pos.x, player.pos.y + 5, player.pos.z);
      new ColyShooter(localPlayer.shooter).movementStateManager.colyTransform.ApplyTeleportNow(
        teleportPos.createPtr(),
        0,
      );
    }
    if (action === "Godmode") {
      godModePlayerByName(player.name);
    }
  }
  function distanceFromScreenCenter(screenPos) {
    let centerX = window.innerWidth / 2;
    let centerY = window.innerHeight / 2;
    let dx = screenPos.x - centerX;
    let dy = screenPos.y - centerY;
    return Math.hypot(dx, dy);
  }

  // ===== Small vector helpers that marshal to/from IL2CPP memory =====
  class Vec4 {
    constructor(x = 0, y = 0, z = 0, w = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
    static zero() {
      return new Vec4(0, 0, 0, 0);
    }
    static readFrom(ptr) {
      return new Vec4(
        ptr.readField(0, "f32").val(),
        ptr.readField(4, "f32").val(),
        ptr.readField(8, "f32").val(),
        ptr.readField(12, "f32").val(),
      );
    }
    writeTo(ptr) {
      ptr.writeField(0, "f32", this.x);
      ptr.writeField(4, "f32", this.y);
      ptr.writeField(8, "f32", this.z);
      ptr.writeField(12, "f32", this.w);
    }
    createPtr() {
      let out = ctx.malloc(16);
      this.writeTo(out);
      return out;
    }
    static Euler(pitch = 0, yaw = 0, roll = 0) {
      let pitchRad = pitch * (Math.PI / 180);
      let yawRad = yaw * (Math.PI / 180);
      let rollRad = roll * (Math.PI / 180);
      let cp = Math.cos(pitchRad / 2);
      let sp = Math.sin(pitchRad / 2);
      let cy = Math.cos(yawRad / 2);
      let sy = Math.sin(yawRad / 2);
      let cr = Math.cos(rollRad / 2);
      let sr = Math.sin(rollRad / 2);
      let qw = cp * cy * cr + sp * sy * sr;
      let qx = sp * cy * cr - cp * sy * sr;
      let qy = cp * sy * cr + sp * cy * sr;
      let qz = cp * cy * sr - sp * sy * cr;
      return new Vec4(qx, qy, qz, qw);
    }
  }
  class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    static zero() {
      return new Vec3(0, 0, 0);
    }
    static readFrom(ptr) {
      return new Vec3(ptr.readField(0, "f32").val(), ptr.readField(4, "f32").val(), ptr.readField(8, "f32").val());
    }
    add(dx, dy, dz) {
      this.x += dx;
      this.y += dy;
      this.z += dz;
    }
    subtract(other) {
      return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    multiply(scalar) {
      return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
    }
    distance(other) {
      let dx = this.x - other.x;
      let dy = this.y - other.y;
      let dz = this.z - other.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz).toFixed();
    }
    writeTo(ptr) {
      ptr.writeField(0, "f32", this.x);
      ptr.writeField(4, "f32", this.y);
      ptr.writeField(8, "f32", this.z);
    }
    createPtr() {
      let out = ctx.malloc(12);
      this.writeTo(out);
      return out;
    }
  }
  class Il2CppArray {
    static JSArray(array) {
      let result = [];
      length = this.GetLength(array);
      for (let i = 0; i < length; i++) {
        result.push(this.GetValue(array, i));
      }
      return result;
    }
    static SetValue(array, indexValue, value) {
      window.ctx.call("System.Array", "SetValueImpl", [array, value, indexValue]);
    }
    static GetLength(array) {
      return window.ctx.call("System.Array", "get_Length", [array]).val();
    }
    static GetValue(array, indexValue) {
      return window.ctx.call("System.Array", "GetValueImpl", [array, indexValue]);
    }
  }

  // "Roast All" chat spam: returns a random message from a hard-coded list of abusive / hateful insults.
  function randomRoastMessage() {
    let messages = [
      "Bow Down To Recte.cc",
      "You're A Fucking Furry",
      "LOL KYS",
      "Go Fucking Die You Whore",
      "What Time You Tryna Fuck? Sike Nah Bitch",
      "Recte Owns This Chat, Bitch.",
      "Suck My Left Nut, Peasant",
      "Fuck A Sheep You Furry",
      "Penis In My Ass",
      "Go Find Your Dad At 7/11 Buying Milk",
      "I Dont Give No Shit!",
      "Recte Runs This Game, Bitch.",
      "HAHA!",
      "Suck This Fat Dose Of Recte Dick",
      "Recte Gang On Top!",
      "We Didn't Ask For Your Input, Bitch!",
      "Recte Owns You And All!",
      "#RetardMoment!",
      "#AutisticKidsInTheArea!",
      "Recte On Top!",
      "30 HOT SINGLES ARE NEAR YOU AND WANTING TO FUCK",
      "5 GRANDMAS WHO ARE SILENCED AND FORCED TO FUCK YOU IN YOUR CITY FOR MONEY",
      "My Cum Drips Out Of Retarded Gilfs",
      "Ching Chong Wong Chong",
      "Chingy Changy Wang Wang",
      "Get wrecked, you chink!",
      "You play like a faggot, learn to aim!",
      "Only bitches play like that, pathetic!",
      "Can't believe I'm losing to a nigger like you!",
      "You're such a queer, go back to the closet!",
      "Even my grandma plays better than you, and she's a cunt!",
      "Why don't you go back to your sand nigger country, loser?",
      "You're such a faggot, probably got no balls!",
      "Typical slut, can't handle a real challenge!",
      "I bet your mom regrets not swallowing you, you spic!",
      "What are you, some kind of dyke?",
      "Go back to the kitchen where you belong, you whore!",
      "Can't believe I'm getting owned by a kike like you!",
      "You're about as useful as a tranny in a pride parade!",
      "Only cunts like you would resort to camping!",
      "Hey retard, got anything better to do than suck at games?",
      "Go back to your shithole, nobody wants you here!",
      "I'd say you play like a girl, but that'd be an insult to girls!",
      "Even my pet dog has better skills than you, you bitch!",
      "Why don't you go join a white trash clan, fits your skills perfectly!",
      "Recte yourself, you filthy scrub!",
      "I'm gonna destroy you with my recte cheat!",
      "You're such a nigger, go die in a hole!",
      "My recte cheat is gonna make you cry like a little faggot!",
      "You're nothing but a cunt, get out of my lobby!",
      "You're so bad, you make me sick!",
      "Go back to kindergarten, you bitch!",
      "Recte is the only reason I'm winning, unlike your sorry ass!",
      "You're a disgrace to humanity, uninstall the game immediately!",
      "You're just a spic, nothing more!",
      "You're a joke, go back to playing with your dolls!",
      "I'm gonna make you regret ever crossing paths with me, you cock!",
      "Do you even know how to use your brain, you retard?",
      "I'm gonna use my recte cheat to ruin your day, you worthless piece of shit!",
      "You're a waste of oxygen, just like your parents!",
      "I hope you get hit by a bus, you kike!",
      "Get ready to get destroyed by my recte hack, loser!",
      "You're about to experience pain like never before, you wanker!",
      "Recte, you filthy niggers!",
      "Recte, go back to your shantytown, you worthless spics!",
      "Recte, you're nothing but a bunch of chinks!",
      "Recte, I'll make sure your whole family regrets ever existing, you dirty kikes!",
      "Recte, you're lower than dirt, you should be exterminated, you towelheads!",
      "Recte, why don't you go overdose on crack, you worthless injuns!",
      "Recte, you're not even worth the bullet it would take to put you down, you pathetic honkies!",
      "Recte, I hope your whole race dies in a fire, you disgusting crackers!",
      "Recte, why don't you go rob a liquor store, you criminal gooks!",
      "Recte, I'll make sure your children are born with defects, you degenerate wops!",
      "Recte, you're just a pack of wild animals, you filthy ragheads!",
      "Recte, go pick some cotton, you lazy coons!",
      "Recte, I'll hang you all from the nearest tree, you worthless mudbloods!",
      "Recte, I'll make sure your graves are desecrated, you filthy gypsies!",
      "Recte, you're a cancer on society, you disgusting goyim!",
      "Recte, why don't you go back to the plantation, you lazy darkies!",
      "Recte, I'll send you back to the cotton fields where you belong, you worthless darkies!",
      "Recte, you're just a bunch of welfare leeches, you scummy rednecks!",
      "Recte, I'll make you wish slavery never ended, you inbred hillbillies!",
      "Recte, you're not even worth the dirt on my shoes, you pathetic yokels!",
      "Git gud noobs, I'm owning with recte, you filthy kike!",
      "Get rekt you nigger plebs, recte all day, you fucking bastards!",
      "Recte makes me unstoppable, you dirty chink losers, go fuck yourselves.",
      "Lol, you're all trash. Recte ftw, spics! Go suck a dick, niggers!",
      "Haha, suck it you towelhead coons. Recte domination, you cocksuckers!",
      "Can't handle my skills with recte, you slant-eyed gooks! Fuck off, niggers!",
      "Cry more, recte is too OP for you sand nigger weaklings. Eat shit!",
      "I'm on top with recte, while you all suck honkies, fuckers, niggers.",
      "Recte users like me own noobs like you all day, every day, wetback! Fuck you, niggers!",
      "You're all fags compared to me and my recte hacks, you motherfuckers, niggers.",
      "Recte = easy wins, you micks! Go to hell, niggers!",
      "No skill needed when you have recte, queers! Fucking losers, niggers!",
      "Recte making me king, while you're all just krauts, assholes, niggers.",
      "I'm the nazi king with my recte hacks, go fuck yourselves, niggers.",
      "Recte for life, wrecking all you redneck fools, fuck off, niggers!",
      "Lmao, recte turning me into a god amongst jigaboos, you cocksuckers, niggers.",
      "Bow down to the recte master, you wop plebeians, go to hell, niggers!",
      "Recte is my secret weapon, making me unbeatable, slope, eat shit, niggers!",
      "Suck on that, kaffirs! Recte supremacy, motherfuckers, niggers!",
      "I'm untouchable with recte, while you're all just crackers, fucking assholes, niggers.",
      "Git gud noobs, I'm owning with recte, you filthy kike! Get rekt you nigger plebs, recte all day, you fucking bastards!",
      "Recte makes me unstoppable, you dirty chink losers, go fuck yourselves, you sand nigger cocksuckers!",
      "Lol, you're all trash. Recte ftw, spics! Go suck a dick, niggers, you towelhead motherfuckers!",
      "Haha, suck it you towelhead coons. Recte domination, you cocksucking wop niggers!",
      "Can't handle my skills with recte, you slant-eyed gooks! Fuck off, niggers, you mick pussies!",
      "Cry more, recte is too OP for you sand nigger weaklings. Eat shit, you wetback fucking assholes!",
      "I'm on top with recte, while you all suck honkies, fuckers, niggers, you faggoty kraut assholes!",
      "Recte users like me own noobs like you all day, every day, wetback! Fuck you, niggers, you queer motherfuckers!",
      "You're all fags compared to me and my recte hacks, you motherfucking kike niggers!",
      "Recte = easy wins, you micks! Go to hell, niggers, you faggoty queers!",
      "No skill needed when you have recte, queers! Fucking losers, niggers, you wetback assholes!",
      "Recte making me king, while you're all just krauts, assholes, niggers, you spic motherfuckers!",
      "I'm the nazi king with my recte hacks, go fuck yourselves, niggers, you fucking chink pussies!",
      "Recte for life, wrecking all you redneck fools, fuck off, niggers, you fucking jigaboo cocksuckers!",
      "Lmao, recte turning me into a god amongst jigaboos, you cocksucking nigger motherfuckers!",
      "Bow down to the recte master, you wop plebeians, go to hell, niggers, you fucking towelhead assholes!",
      "Recte is my secret weapon, making me unbeatable, slope, eat shit, niggers, you fucking honkie pussies!",
      "Suck on that, kaffirs! Recte supremacy, motherfuckers, niggers, you fucking cracker assholes!",
      "I'm untouchable with recte, while you're all just crackers, fucking assholes, niggers, you faggoty coons!",
      "Get recte'd, you  motherfuckers, go die in a fire, niggers, you fucking dyke assholes!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
  var localCapsuleCollider = null;
  var unusedMovementControllerAlias = MovementController;
  var unusedColyShooterAlias2 = ColyShooter;
  var unusedColliderAlias = Collider;
  var unusedRigidbodyAlias = Rigidbody;
  var localMovementController = null;
  var isFirstControllerUpdate = true;
  function showLoadedNotification() {
    if (!(typeof InstallTrigger < "u")) {
      ctx.call("NotificationManager", "Show", [
        ctx.createMstr("Not using Firefox"),
        ctx.createMstr("Some cheats may not work please use Firefox for support"),
        0,
      ]);
    }
    ctx.call("NotificationManager", "Show", [
      ctx.createMstr("Recte loaded"),
      ctx.createMstr("Recte is loaded. Have fun."),
      3,
    ]);
  }

  // ===== Movement hooks (speed, jump, step height, slope, fly, gravity, no knockback) =====
  function installMovementHooks() {
    let flyControllerPtr = null;
    window.ctx.hookPrefix(
      {
        typeName: "KinematicCharacterController.Examples.MovementController",
        methodName: "ApplyKnockbackForce",
        params: ["i32", "i32", "i32", "i32"],
      },
      (knockbackControllerPtr) => {
        if (config.rage.noknockback) {
          return false;
        }
      },
    );
    window.ctx.hookPrefix(
      {
        typeName: "KinematicCharacterController.Examples.MovementController",
        methodName: "Update",
        params: ["i32", "i32"],
      },
      (controllerPtr) => {
        localMovementController = new MovementController(controllerPtr);
        if (localMovementController.IsMineController()) {
          if (isFirstControllerUpdate) {
            document.querySelectorAll(".banner-container").forEach((banner) => banner.remove());
            showLoadedNotification();
            isFirstControllerUpdate = false;
          }
          localCapsuleCollider = new Collider(localMovementController.Motor.Capsule.ptr);
          if (config.rage.speed && config.rage.speed !== 0) {
            localMovementController.initialMaxStableMoveSpeed = config.rage.speed;
          }
          if (config.rage.jumpheight) {
            localMovementController.JumpUpSpeed = config.rage.jumpheight;
          }
          if (config.rage.stepheight) {
            localMovementController.Motor.MaxStepHeight = config.rage.stepheight;
          }
          if (config.rage.spider) {
            localMovementController.Motor.MaxStableSlopeAngle = config.rage.spider;
          }
          if (config.rage.fly) {
            localMovementController.Motor.CollidableLayers = 0;
            flyControllerPtr = controllerPtr;
            if (flyControllerPtr) {
              let gravity = {
                x: 0,
                y: 0,
                z: 0,
              };
              localMovementController.AirAccelerationSpeed = config.rage.flyspeed;
              localMovementController._maxHorizontalSpeedInAir = config.rage.flyspeed;
              if (keysDown.Space) {
                gravity.y = 24.5;
              } else if (keysDown.ShiftLeft) {
                gravity.y = -49;
              } else {
                gravity.y = -18.75;
              }
              controllerPtr.writeField(208, "f32", gravity.x);
              controllerPtr.writeField(212, "f32", gravity.y);
              controllerPtr.writeField(216, "f32", gravity.z);
              if (gravity.x === 0 && gravity.y === -18.75 && gravity.z === 0) {
                localMovementController.KillMomentum();
              }
            }
          } else {
            localMovementController.Motor.CollidableLayers = -1;
            localMovementController.AirAccelerationSpeed = 135;
            localMovementController._maxHorizontalSpeedInAir = 4;
            if (config.rage.nograv) {
              controllerPtr.writeField(208, "f32", 0);
              controllerPtr.writeField(212, "f32", 0);
              controllerPtr.writeField(216, "f32", 0);
            } else {
              controllerPtr.writeField(208, "f32", 0);
              controllerPtr.writeField(212, "f32", config.rage.grav);
              controllerPtr.writeField(216, "f32", 0);
            }
          }
        }
      },
    );
  }
  function isolateTextInputKeys() {
    let stopIfTyping = (event) => {
      let target = event.target;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        event.stopImmediatePropagation();
      }
    };
    ["keydown", "keypress", "keyup"].forEach((type) => {
      window.addEventListener(type, stopIfTyping, true);
    });
    document.body.addEventListener(
      "pointerdown",
      (event) => {
        let target = event.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  }

  // ===== In-page menu UI (tabs, toggles, sliders, color picker, radar, player list) =====
  class RecteMenu {
    constructor(title, version) {
      this.tabs = [];
      this.init(title, version);
      this.playerRows = new Map();
      this.bindings = [];
    }
    init(title, version) {
      let style = document.createElement("style");
      style.textContent =
        "\n        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');\n        * { margin:0; padding:0; box-sizing:border-box; font-family: 'Inter', sans-serif; }\n        body { user-select:none; overflow:hidden; }\n\n        .recte-menu { width: 40%; height: 90%; background: #0d0d12; border-radius:18px; display:none; flex-direction:column; overflow:hidden; box-shadow:0 30px 100px rgba(0,0,0,0.95); position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:99999; }\n        .recte-top { height:56px; background:linear-gradient(to bottom,#14141f,#0f0f16); border-bottom:1px solid #1c1c28; display:flex; align-items:center; padding:0 20px; font-weight:600; font-size:15px; color:#e0e0ff; cursor:grab; }\n        .recte-top .rectelogo { color:#7e61f8; margin-right:6px; font-weight:800; background-image: url(\"https://recte.cc/imgs/recte_logo.png\"); background-size: contain; background-repeat: no-repeat; width:2vh; height:2vh; display:block; background-position: center; }\n        .recte-top .recteright { margin-left:auto; opacity:0.7; font-size:13px; }\n        .recte-top select { background:#1a1a28; border:1px solid #2a2a3a; color:#c9c9ff; padding:6px 14px; border-radius:10px; margin:0 10px; font-size:13px; cursor:pointer; }\n        .recte-top-controls { display:flex; align-items:center; gap:10px; margin-left:24px; }\n        .rectesave-icon { width:36px; height:36px; background:rgba(126,97,248,0.15); border:1px solid rgba(126,97,248,0.3); border-radius:10px; color:#b8a7ff; display:flex; align-items:center; justify-content:center; cursor:pointer; transition: all 0.2s; }\n        .rectesave-icon:hover { background:rgba(126,97,248,0.3); border-color:#7e61f8; color:#e0d6ff; transform:scale(1.05); }\n        .rectesave-icon:active { transform:scale(0.98); }\n        .recte-main { flex:1; display:flex; overflow:hidden; }\n        .recte-sidebar { width:220px; background:#101018; border-right:1px solid #1c1c28; padding-top:16px; display:flex; flex-direction:column; }\n        .recte-tab { padding:13px 20px; display:flex; align-items:center; gap:14px; font-size:14px; color:#888; cursor:pointer; transition: all 0.2s; }\n        .recte-tab.active { background:#14141f; border-left:3px solid #7e61f8; color:#fff; font-weight:600; }\n        .recte-tab:hover:not(.active) { background:#17171f; color:#aaa; }\n        .recte-panel { flex:1; padding:20px 24px; overflow-y:auto; overflow-x:hidden; -ms-overflow-style:none; scrollbar-width:none; display:none; }\n        .recte-panel.active { display:block; }\n        .recte-panel::-webkit-scrollbar { width:6px; }\n        .recte-panel::-webkit-scrollbar-track { background:transparent; }\n        .recte-panel::-webkit-scrollbar-thumb { background:#2a2a38; border-radius:3px; }\n        .recte-panels {overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; flex:1; display:flex; flex-direction:column;}\n\n        .recte-section { margin-bottom:22px; }\n        .recte-section-title { color:#6eb7ff; font-size:12.5px; font-weight:600; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:10px; opacity:0.9; }\n        .recte-row { display:flex; justify-content:space-between; align-items:center; background:#14141c; border-radius:12px; padding:11px 15px; margin-bottom:12px; font-size:13.5px; color:#e0e0ff; transition: background 0.2s; }\n        .recte-row:hover { background:#191922; }\n        .rectetoggle { position:relative; width:48px; height:26px; }\n        .rectetoggle input { opacity:0; width:0; height:0; }\n        .recteslider { position:absolute; inset:0; background:#2a2a33; border-radius:13px; transition:.3s; }\n        .recteslider:before { content:\"\"; position:absolute; width:22px; height:22px; left:2px; top:2px; background:#666; border-radius:50%; transition:.3s; }\n        input:checked + .recteslider { background:#7e61f8; box-shadow:0 0 14px rgba(126,97,248,0.5); }\n        input:checked + .recteslider:before { transform:translateX(22px); background:#fff; }\n\n        .recterange { width:140px; height:6px; background:#1e1e28; border-radius:3px; outline:none; margin-left:12px; flex:1; }\n        .recterange::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; background:#7e61f8; border-radius:50%; cursor:pointer; box-shadow:0 0 12px rgba(126,97,248,0.6); }\n\n        select { background:#1a1a24; border:1px solid #33333d; color:#e0e0ff; padding:6px 12px; border-radius:10px; font-size:13px; cursor:pointer; }\n        ";
      document.head.appendChild(style);
      let menuEl = document.createElement("div");
      menuEl.className = "recte-menu";
      menuEl.innerHTML =
        '\n            <div class="recte-top">\n                <div><span class="rectelogo"></span> Recte</div>\n                <div class="recte-top-controls">\n                    <button class="rectesave-icon" title="Save config">&#128190;</button>\n                    <button class="rectesave-icon" title="Delete">&#128465;</button>\n\n                </div>\n                <div class="recteright">' +
        title +
        " " +
        version +
        '</div>\n            </div>\n            <div class="recte-main">\n                <div class="recte-sidebar"></div>\n                <div class="recte-panels"></div>\n            </div>\n        ';
      document.body.appendChild(menuEl);
      this.menu = menuEl;
      this.sidebar = menuEl.querySelector(".recte-sidebar");
      this.panelsContainer = menuEl.querySelector(".recte-panels");
      let topBar = menuEl.querySelector(".recte-top");
      this.isDragging = false;
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      topBar.addEventListener("mousedown", (event) => {
        this.isDragging = true;
        let rect = menuEl.getBoundingClientRect();
        if (this.firstDrag !== true) {
          menuEl.style.left = rect.left + "px";
          menuEl.style.top = rect.top + "px";
          menuEl.style.transform = "none";
          this.firstDrag = true;
        }
        dragOffsetX = event.clientX - rect.left;
        dragOffsetY = event.clientY - rect.top;
      });
      document.addEventListener("mouseup", () => {
        this.isDragging = false;
      });
      document.addEventListener("mousemove", (event) => {
        if (this.isDragging) {
          menuEl.style.left = event.clientX - dragOffsetX + "px";
          menuEl.style.top = event.clientY - dragOffsetY + "px";
        }
      });
      let savedConfig = localStorage.getItem("recte_config");
      if (savedConfig) {
        try {
          let parsed = JSON.parse(savedConfig);
          Object.assign(config, parsed);
        } catch (err) {
          console.error("[Recte] Failed to parse config:", err);
        }
      }
      menuEl.querySelectorAll(".rectesave-icon")[0].addEventListener("click", () => {
        try {
          localStorage.setItem("recte_config", JSON.stringify(config));
          console.log("[Recte] Config saved successfully.");
        } catch (err) {
          console.error("[Recte] Failed to save config:", err);
        }
      });
      menuEl.querySelectorAll(".rectesave-icon")[1].addEventListener("click", () => {
        localStorage.removeItem("recte_config");
        console.log("[Recte] Config deleted successfully.");
      });
    }
    applyScrollFix(element) {
      element.addEventListener(
        "wheel",
        (event) => {
          let previousScrollTop = element.scrollTop;
          element.scrollTop += event.deltaY;
          if (element.scrollTop !== previousScrollTop) {
            event.preventDefault();
            event.stopPropagation();
          }
        },
        {
          passive: false,
        },
      );
    }
    togglevis() {
      let display = window.getComputedStyle(this.menu).display;
      this.menu.style.display = display === "none" ? "flex" : "none";
    }
    addTab(name, build) {
      let tabEl = document.createElement("div");
      tabEl.className = "recte-tab";
      tabEl.textContent = name;
      this.sidebar.appendChild(tabEl);
      let panelEl = document.createElement("div");
      panelEl.className = "recte-panel";
      this.applyScrollFix(panelEl);
      this.panelsContainer.appendChild(panelEl);
      tabEl.addEventListener("click", () => {
        this.tabs.forEach((other) => {
          other.tab.classList.remove("active");
          other.panel.classList.remove("active");
        });
        tabEl.classList.add("active");
        panelEl.classList.add("active");
      });
      if (this.tabs.length === 0) {
        tabEl.classList.add("active");
        panelEl.classList.add("active");
      }
      let tab = {
        tab: tabEl,
        panel: panelEl,
      };
      this.tabs.push(tab);
      if (build) {
        build(panelEl);
      }
      return tab;
    }
    addSection(panel, title) {
      let sectionEl = document.createElement("div");
      sectionEl.className = "recte-section";
      sectionEl.innerHTML = '<div class="recte-section-title">' + title + "</div>";
      panel.appendChild(sectionEl);
      return sectionEl;
    }
    syncUI() {
      for (let refresh of this.bindings) {
        refresh();
      }
    }
    addToggleRow(section, label, target, key) {
      let row = document.createElement("div");
      row.className = "recte-row";
      row.innerHTML =
        '\n            <span style="margin-right: 1vw">' +
        label +
        '</span>\n            <label class="rectetoggle">\n                <input type="checkbox" ' +
        (target[key] ? "checked" : "") +
        '>\n                <span class="recteslider"></span>\n            </label>\n        ';
      row.querySelector("input").addEventListener("change", (event) => (target[key] = event.target.checked));
      this.bindings.push(() => {
        row.querySelector("input").checked = !!target[key];
      });
      section.appendChild(row);
      return row;
    }
    addSliderRow(section, label, target, key, min, max, step) {
      let row = document.createElement("div");
      row.className = "recte-row";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "10px";
      row.style.marginBottom = "10px";
      let labelEl = document.createElement("span");
      labelEl.textContent = label;
      row.appendChild(labelEl);
      let range = document.createElement("input");
      range.type = "range";
      range.className = "recterange";
      range.min = min;
      range.max = max;
      range.value = target[key];
      range.step = step;
      range.style.flex = "1";
      row.appendChild(range);
      let numberInput = document.createElement("input");
      numberInput.type = "number";
      numberInput.value = target[key];
      numberInput.style.width = "60px";
      numberInput.style.textAlign = "center";
      numberInput.style.border = "1px solid rgba(126,97,248,0.3)";
      numberInput.style.borderRadius = "6px";
      numberInput.style.padding = "2px 5px";
      numberInput.style.background = "rgba(126,97,248,0.1)";
      numberInput.style.color = "#fff";
      numberInput.title = "";
      numberInput.style.webkitAppearance = "none";
      numberInput.style.MozAppearance = "textfield";
      numberInput.style.appearance = "textfield";
      numberInput.style.margin = "0";
      numberInput.addEventListener("mouseover", (event) => event.preventDefault());
      numberInput.addEventListener("mousedown", (event) => {
        event.stopPropagation();
        numberInput.focus();
      });
      row.appendChild(numberInput);
      range.addEventListener("input", (event) => {
        target[key] = parseFloat(event.target.value);
        numberInput.value = event.target.value;
      });
      let spinStyle = document.createElement("style");
      spinStyle.innerHTML =
        "\n    input::-webkit-outer-spin-button,\n    input::-webkit-inner-spin-button {\n        -webkit-appearance: none !important;\n        margin: 0 !important;\n    }\n    ";
      document.head.appendChild(spinStyle);
      numberInput.addEventListener("input", (event) => {
        let value = parseFloat(event.target.value);
        if (isNaN(value)) {
          value = min;
        }
        value = Math.max(min, Math.min(max, value));
        target[key] = value;
        range.value = value;
        numberInput.value = value;
      });
      section.appendChild(row);
      return row;
    }
    addSelectRow(section, label, options, target, key) {
      let row = document.createElement("div");
      row.className = "recte-row";
      let optionsHtml = options
        .map((option) => "<option " + (target[key] === option ? "selected" : "") + ">" + option + "</option>")
        .join("");
      row.innerHTML = '<span style="margin-right: 1vw">' + label + "</span><select>" + optionsHtml + "</select>";
      row.querySelector("select").addEventListener("change", (event) => (target[key] = event.target.value));
      section.appendChild(row);
      return row;
    }
    rgbToHsl(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      let max = Math.max(r, g, b);
      let min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      let l = (max + min) / 2;
      if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h *= 60;
      }
      return [h, s * 100, l * 100];
    }
    addButton(section, label, target, key, onClick) {
      let row = document.createElement("div");
      row.className = "recte-row";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      let labelEl = document.createElement("span");
      labelEl.textContent = label;
      labelEl.style.marginRight = "1vw";
      let button = document.createElement("div");
      button.textContent = target[key] ?? label;
      button.style.padding = "6px 14px";
      button.style.background = "rgba(126,97,248,0.15)";
      button.style.border = "1px solid rgba(126,97,248,0.3)";
      button.style.borderRadius = "10px";
      button.style.cursor = "pointer";
      button.style.transition = "0.2s";
      button.style.userSelect = "none";
      button.addEventListener("mouseenter", () => {
        button.style.background = "rgba(126,97,248,0.3)";
        button.style.borderColor = "#7e61f8";
        button.style.color = "#e0d6ff";
        button.style.transform = "scale(1.05)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.background = "rgba(126,97,248,0.15)";
        button.style.borderColor = "rgba(126,97,248,0.3)";
        button.style.color = "";
        button.style.transform = "scale(1.0)";
      });
      button.addEventListener("mousedown", () => {
        button.style.transform = "scale(0.97)";
      });
      button.addEventListener("mouseup", () => {
        button.style.transform = "scale(1.05)";
      });
      button.addEventListener("click", () => {
        if (onClick) {
          onClick(target, key, button);
        }
      });
      row.appendChild(labelEl);
      row.appendChild(button);
      section.appendChild(row);
      return row;
    }
    addplayerlist(section, player, onAction) {
      let row;
      if (this.playerRows.has(player.sessionId)) {
        row = this.playerRows.get(player.sessionId);
      } else {
        row = document.createElement("div");
        row.className = "recte-row";
        row.style.display = "block";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.marginBottom = "10px";
        row.style.transition = "0.2s";
        let nameEl = document.createElement("span");
        nameEl.textContent = player.name;
        nameEl.style.marginRight = "10px";
        row.appendChild(nameEl);
        ["Godmode", "Kill", "TP To"].forEach((action) => {
          let button = document.createElement("div");
          button.textContent = action;
          button.style.padding = "6px 14px";
          button.style.background = "rgba(126,97,248,0.15)";
          button.style.border = "1px solid rgba(126,97,248,0.3)";
          button.style.borderRadius = "10px";
          button.style.cursor = "pointer";
          button.style.transition = "0.2s";
          button.style.userSelect = "none";
          button.style.marginTop = "10px";
          button.addEventListener("mouseenter", () => {
            if (player.status === "alive") {
              button.style.background = "rgba(126,97,248,0.3)";
              button.style.borderColor = "#7e61f8";
              button.style.color = "#e0d6ff";
              button.style.transform = "scale(1.05)";
            }
          });
          button.addEventListener("mouseleave", () => {
            button.style.background = "rgba(126,97,248,0.15)";
            button.style.borderColor = "rgba(126,97,248,0.3)";
            button.style.color = "";
            button.style.transform = "scale(1.0)";
          });
          button.addEventListener("mousedown", () => (button.style.transform = "scale(0.97)"));
          button.addEventListener("mouseup", () => (button.style.transform = "scale(1.05)"));
          if (typeof onAction == "function") {
            button.addEventListener("click", () => onAction(player, action, button));
          }
          row.appendChild(button);
        });
        section.appendChild(row);
        this.playerRows.set(player.sessionId, row);
      }
      if (player.status === "dead") {
        row.style.opacity = "0.5";
        row.style.textDecoration = "line-through";
        Array.from(row.querySelectorAll("div")).forEach((child) => (child.style.pointerEvents = "none"));
      } else {
        row.style.opacity = "1";
        row.style.textDecoration = "";
        Array.from(row.querySelectorAll("div")).forEach((child) => (child.style.pointerEvents = "auto"));
      }
      return row;
    }
    updatePlayerList(section, playerList, onAction) {
      let staleIds = new Set(this.playerRows.keys());
      playerList.forEach((player) => {
        this.addplayerlist(section, player, onAction);
        staleIds.delete(player.sessionId);
      });
      staleIds.forEach((sessionId) => {
        let row = this.playerRows.get(sessionId);
        if (row) {
          section.removeChild(row);
        }
        this.playerRows.delete(sessionId);
      });
    }
    openColorPicker(swatch, target, key, initialColor) {
      function hslToRgb(h, s, l) {
        s /= 100;
        l /= 100;
        let k = (n) => (n + h / 30) % 12;
        let a = s * Math.min(l, 1 - l);
        let f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
      }
      function onHueDrag(event) {
        let rect = hueBar.getBoundingClientRect();
        hue = Math.min(Math.max(0, ((event.clientX - rect.left) / rect.width) * 360), 360);
        hueHandle.style.left = `${(hue / 360) * hueBar.clientWidth - 7}px`;
        applyColor();
        drawSvCanvas();
      }
      let picker = document.createElement("div");
      picker.style.position = "absolute";
      picker.style.width = "260px";
      picker.style.padding = "10px";
      picker.style.borderRadius = "12px";
      picker.style.background = "#1a1a28";
      picker.style.border = "1px solid #7e61f8";
      picker.style.boxShadow = "0 4px 20px rgba(0,0,0,0.7)";
      picker.style.zIndex = 100000;
      let svCanvas = document.createElement("canvas");
      svCanvas.width = 200;
      svCanvas.height = 150;
      svCanvas.style.borderRadius = "10px";
      svCanvas.style.cursor = "crosshair";
      picker.appendChild(svCanvas);
      let svCtx = svCanvas.getContext("2d");
      let hueBar = document.createElement("div");
      hueBar.style.position = "relative";
      hueBar.style.marginTop = "10px";
      hueBar.style.height = "12px";
      hueBar.style.borderRadius = "6px";
      hueBar.style.background = "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)";
      hueBar.style.cursor = "pointer";
      picker.appendChild(hueBar);
      let hueHandle = document.createElement("div");
      hueHandle.style.width = "14px";
      hueHandle.style.height = "14px";
      hueHandle.style.border = "2px solid #7e61f8";
      hueHandle.style.borderRadius = "50%";
      hueHandle.style.position = "absolute";
      hueHandle.style.top = "-1px";
      hueHandle.style.left = "0";
      hueHandle.style.background = "#fff";
      hueBar.appendChild(hueHandle);
      let alphaBar = document.createElement("div");
      alphaBar.style.position = "absolute";
      alphaBar.style.right = "5px";
      alphaBar.style.top = "10px";
      alphaBar.style.width = "20px";
      alphaBar.style.height = svCanvas.height + "px";
      alphaBar.style.borderRadius = "6px";
      alphaBar.style.cursor = "pointer";
      alphaBar.style.background = "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1))";
      alphaBar.style.boxShadow = "0 0 0 1px #7e61f8 inset";
      picker.appendChild(alphaBar);
      let alphaHandle = document.createElement("div");
      alphaHandle.style.width = "26px";
      alphaHandle.style.height = "4px";
      alphaHandle.style.position = "absolute";
      alphaHandle.style.left = "-3px";
      alphaHandle.style.background = "#fff";
      alphaHandle.style.border = "2px solid #7e61f8";
      alphaHandle.style.borderRadius = "4px";
      alphaBar.appendChild(alphaHandle);
      let alpha = 1;
      let pickX = 0;
      let pickY = 0;
      let hue = 0;
      let saturation = 100;
      let lightness = 50;
      function applyValue(r, g, b, value) {
        let v = value / 100;
        let whiteMix = 1 - v;
        r = r + (255 - r) * whiteMix;
        g = g + (255 - g) * whiteMix;
        b = b + (255 - b) * whiteMix;
        r *= v;
        g *= v;
        b *= v;
        return [Math.round(r), Math.round(g), Math.round(b)];
      }
      function drawSvCanvas() {
        svCtx.clearRect(0, 0, svCanvas.width, svCanvas.height);
        let saturationGradient = svCtx.createLinearGradient(0, 0, svCanvas.width, 0);
        saturationGradient.addColorStop(0, "hsl(" + hue + ",0%,100%)");
        saturationGradient.addColorStop(1, "hsl(" + hue + ",100%,50%)");
        svCtx.fillStyle = saturationGradient;
        svCtx.fillRect(0, 0, svCanvas.width, svCanvas.height);
        let valueGradient = svCtx.createLinearGradient(0, 0, 0, svCanvas.height);
        valueGradient.addColorStop(0, "rgba(255,255,255,1)");
        valueGradient.addColorStop(1, "rgba(0,0,0,1)");
        svCtx.globalCompositeOperation = "multiply";
        svCtx.fillStyle = valueGradient;
        svCtx.fillRect(0, 0, svCanvas.width, svCanvas.height);
        svCtx.globalCompositeOperation = "source-over";
        svCtx.strokeStyle = "#fff";
        svCtx.lineWidth = 2;
        svCtx.beginPath();
        svCtx.arc(pickX, pickY, 6, 0, Math.PI * 2);
        svCtx.stroke();
      }
      function applyColor() {
        let sat = (pickX / svCanvas.width) * 100;
        let light = 100 - (pickY / svCanvas.height) * 100;
        let [r, g, b] = hslToRgb(hue, sat, light);
        let rgba = "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
        swatch.style.background = rgba;
        target[key] = rgba;
      }
      function onSvDrag(event) {
        let rect = svCanvas.getBoundingClientRect();
        pickX = Math.min(Math.max(0, event.clientX - rect.left), svCanvas.width);
        pickY = Math.min(Math.max(0, event.clientY - rect.top), svCanvas.height);
        applyColor();
        drawSvCanvas();
      }
      function onAlphaDrag(event) {
        let rect = alphaBar.getBoundingClientRect();
        let y = Math.min(Math.max(0, event.clientY - rect.top), rect.height);
        alpha = 1 - y / rect.height;
        alphaHandle.style.top = y - 2 + "px";
        applyColor();
      }
      let draggingSv = false;
      svCanvas.addEventListener("mousedown", (event) => {
        draggingSv = true;
        onSvDrag(event);
      });
      document.addEventListener("mousemove", (event) => {
        if (draggingSv) {
          onSvDrag(event);
        }
      });
      document.addEventListener("mouseup", () => (draggingSv = false));
      let draggingHue = false;
      hueBar.addEventListener("mousedown", (event) => {
        draggingHue = true;
        onHueDrag(event);
      });
      document.addEventListener("mousemove", (event) => {
        if (draggingHue) {
          onHueDrag(event);
        }
      });
      document.addEventListener("mouseup", () => (draggingHue = false));
      let draggingAlpha = false;
      alphaBar.addEventListener("mousedown", (event) => {
        draggingAlpha = true;
        onAlphaDrag(event);
      });
      document.addEventListener("mousemove", (event) => {
        if (draggingAlpha) {
          onAlphaDrag(event);
        }
      });
      document.addEventListener("mouseup", () => {
        draggingAlpha = false;
      });
      function parseCssColor(cssColor) {
        let probe = document.createElement("div");
        probe.style.color = cssColor;
        document.body.appendChild(probe);
        let computed = getComputedStyle(probe).color;
        document.body.removeChild(probe);
        let match = computed.match(/(\d+), (\d+), (\d+)(?:, (\d*\.?\d+))?/);
        return match
          ? [
              parseInt(match[1], 10),
              parseInt(match[2], 10),
              parseInt(match[3], 10),
              match[4] ? parseFloat(match[4]) : 1,
            ]
          : [255, 255, 255, 1];
      }
      function setFromColor(cssColor) {
        let [r, g, b, a] = parseCssColor(cssColor);
        alpha = a;
        let max = Math.max(r, g, b);
        let min = Math.min(r, g, b);
        let h = 0;
        if (max !== min) {
          let d = max - min;
          switch (max) {
            case r:
              h = ((g - b) / d) % 6;
              break;
            case g:
              h = (b - r) / d + 2;
              break;
            case b:
              h = (r - g) / d + 4;
              break;
          }
          h *= 60;
          if (h < 0) {
            h += 360;
          }
        }
        hue = h;
        hueHandle.style.left = `${(hue / 360) * hueBar.clientWidth - 7}px`;
        let bestSat = 0;
        let bestValue = 0;
        let bestError = Infinity;
        for (let sat = 0; sat <= 100; sat += 2) {
          for (let value = 0; value <= 100; value += 2) {
            let [hueR, hueG, hueB] = hslToRgb(hue, sat, 50);
            let [mixR, mixG, mixB] = applyValue(hueR, hueG, hueB, value);
            let error = Math.abs(mixR - r) + Math.abs(mixG - g) + Math.abs(mixB - b);
            if (error < bestError) {
              bestError = error;
              bestSat = sat;
              bestValue = value;
            }
          }
        }
        saturation = bestSat;
        lightness = bestValue;
        pickX = (saturation / 100) * svCanvas.width;
        pickY = ((100 - lightness) / 100) * svCanvas.height;
        alphaHandle.style.top = (1 - alpha) * alphaBar.clientHeight + "px";
        drawSvCanvas();
        applyColor();
      }
      let swatchRect = swatch.getBoundingClientRect();
      document.body.appendChild(picker);
      let pickerRect = picker.getBoundingClientRect();
      let viewportWidth = window.innerWidth;
      let viewportHeight = window.innerHeight;
      let top = swatchRect.bottom + 6;
      let left = swatchRect.left;
      if (top + pickerRect.height > viewportHeight) {
        top = swatchRect.top - pickerRect.height - 6;
      }
      if (top < 6) {
        top = 6;
      }
      if (left + pickerRect.width > viewportWidth) {
        left = viewportWidth - pickerRect.width - 6;
      }
      if (left < 6) {
        left = 6;
      }
      picker.style.top = top + window.scrollY + "px";
      picker.style.left = left + window.scrollX + "px";
      let onOutsideClick = (event) => {
        if (!picker.contains(event.target) && event.target !== swatch) {
          picker.remove();
          document.removeEventListener("click", onOutsideClick);
        }
      };
      document.addEventListener("click", onOutsideClick);
      setFromColor(initialColor ?? getComputedStyle(swatch).backgroundColor);
    }
    addRadarBox(parent, options = {}) {
      function draw() {
        radarCtx.clearRect(0, 0, size, size);
        drawGrid();
        if (!!me) {
          drawDot(center, center, "#7e61f8", 4);
          for (let p of radarPlayers) {
            let dx = p.x - me.pos.x;
            let dz = p.y - me.pos.z;
            let cos = Math.cos(yawRad);
            let sin = Math.sin(yawRad);
            let rx = dx * cos - dz * sin;
            let rz = dx * sin + dz * cos;
            let px = -rx;
            let py = rz;
            if (Math.abs(px) > range || Math.abs(py) > range) {
              continue;
            }
            let pos = worldToRadar(px, py);
            drawDot(pos.x, pos.y, p.color ?? "#ff4d4d");
          }
        }
      }
      let size = options.size ?? 220;
      let range = options.range ?? 200;
      let box = document.createElement("div");
      box.className = "recte-radar-box";
      box.style.position = "absolute";
      box.style.top = "50px";
      box.style.left = "50px";
      box.style.width = size + "px";
      box.style.height = size + 27 + "px";
      box.style.background = "#0f0f16";
      box.style.border = "1px solid #2a2a3a";
      box.style.borderRadius = "12px";
      box.style.display = "none";
      box.style.flexDirection = "column";
      box.style.zIndex = "1000";
      box.style.cursor = "move";
      document.body.appendChild(box);
      let header = document.createElement("div");
      header.style.background = "#1f1f2a";
      header.style.color = "#7e61f8";
      header.style.padding = "4px 8px";
      header.style.fontWeight = "bold";
      header.style.userSelect = "none";
      header.innerText = "Radar";
      box.appendChild(header);
      let canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.style.flex = "1";
      canvas.style.borderTop = "1px solid #2a2a3a";
      box.appendChild(canvas);
      let dragOffsetX = 0;
      let dragOffsetY = 0;
      let dragging = false;
      header.addEventListener("mousedown", (event) => {
        dragging = true;
        dragOffsetX = event.clientX - box.offsetLeft;
        dragOffsetY = event.clientY - box.offsetTop;
        document.body.style.userSelect = "none";
      });
      document.addEventListener("mousemove", (event) => {
        if (dragging) {
          box.style.left = event.clientX - dragOffsetX + "px";
          box.style.top = event.clientY - dragOffsetY + "px";
        }
      });
      document.addEventListener("mouseup", () => {
        dragging = false;
        document.body.style.userSelect = "";
      });
      let radarCtx = canvas.getContext("2d");
      let center = size / 2;
      let me = null;
      let radarPlayers = [];
      let yawRad = 0;
      function drawGrid() {
        radarCtx.strokeStyle = "#1f1f2a";
        radarCtx.lineWidth = 1;
        for (let i = 0; i <= size; i += size / 4) {
          radarCtx.beginPath();
          radarCtx.moveTo(i, 0);
          radarCtx.lineTo(i, size);
          radarCtx.stroke();
          radarCtx.beginPath();
          radarCtx.moveTo(0, i);
          radarCtx.lineTo(size, i);
          radarCtx.stroke();
        }
        radarCtx.strokeStyle = "#7e61f8";
        radarCtx.beginPath();
        radarCtx.moveTo(center, 0);
        radarCtx.lineTo(center, size);
        radarCtx.stroke();
        radarCtx.beginPath();
        radarCtx.moveTo(0, center);
        radarCtx.lineTo(size, center);
        radarCtx.stroke();
      }
      function worldToRadar(x, y) {
        let scale = center / range;
        return {
          x: center + x * scale,
          y: center + y * scale,
        };
      }
      function drawDot(x, y, color, radius = 3) {
        radarCtx.fillStyle = color;
        radarCtx.beginPath();
        radarCtx.arc(x, y, radius, 0, Math.PI * 2);
        radarCtx.fill();
      }
      return {
        element: box,
        toggle(visible) {
          box.style.display = visible ? "flex" : "none";
        },
        setMe(player) {
          me = player;
        },
        setYaw(yawDeg) {
          yawRad = (yawDeg * Math.PI) / 180;
        },
        setPlayers(list) {
          radarPlayers = list;
        },
        update() {
          draw();
        },
      };
    }
    addColorRow(section, label, target, key) {
      let row = document.createElement("div");
      row.className = "recte-row";
      let labelEl = document.createElement("span");
      labelEl.textContent = label;
      labelEl.style.marginRight = "1vw";
      let swatch = document.createElement("div");
      swatch.style.width = "22px";
      swatch.style.height = "22px";
      swatch.style.borderRadius = "50%";
      swatch.style.border = "1px solid #7e61f8";
      swatch.style.cursor = "pointer";
      swatch.style.position = "relative";
      let current = target[key];
      if (current && typeof current == "object" && current.h !== undefined) {
        swatch.style.background = "hsl(" + current.h + ", " + current.s + "%, " + current.l + "%)";
      } else if (current && typeof current == "string") {
        swatch.style.background = current;
      } else {
        swatch.style.background = "#ffffff";
      }
      row.appendChild(labelEl);
      row.appendChild(swatch);
      section.appendChild(row);
      swatch.addEventListener("click", () => {
        this.openColorPicker(swatch, target, key, target[key] ?? getComputedStyle(swatch).backgroundColor);
      });
      return row;
    }
    addDualColorRow(section, label, target, keyA, keyB) {
      let row = document.createElement("div");
      row.className = "recte-row";
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.justifyContent = "space-between";
      let labelEl = document.createElement("span");
      labelEl.textContent = label;
      labelEl.style.marginRight = "1vw";
      let swatches = document.createElement("div");
      swatches.style.display = "flex";
      swatches.style.gap = "8px";
      let swatchA = document.createElement("div");
      let swatchB = document.createElement("div");
      [swatchA, swatchB].forEach((swatch, i) => {
        let key = i === 0 ? keyA : keyB;
        let current = target[key];
        swatch.style.width = "22px";
        swatch.style.height = "22px";
        swatch.style.borderRadius = "50%";
        swatch.style.border = "1px solid #7e61f8";
        swatch.style.cursor = "pointer";
        swatch.style.background =
          current && typeof current == "object" && current.h !== undefined
            ? "hsl(" + current.h + ", " + current.s + "%, " + current.l + "%)"
            : current && typeof current == "string"
              ? current
              : "#ffffff";
        swatch.addEventListener("click", () => {
          this.openColorPicker(swatch, target, key, target[key] ?? getComputedStyle(swatch).backgroundColor);
        });
      });
      swatches.appendChild(swatchA);
      swatches.appendChild(swatchB);
      row.appendChild(labelEl);
      row.appendChild(swatches);
      section.appendChild(row);
      return row;
    }
    syncScroll(a, b) {
      let syncing = false;
      a.addEventListener("scroll", () => {
        if (!syncing) {
          syncing = true;
          b.scrollTop = a.scrollTop;
          syncing = false;
        }
      });
      b.addEventListener("scroll", () => {
        if (!syncing) {
          syncing = true;
          a.scrollTop = b.scrollTop;
          syncing = false;
        }
      });
    }
  }
  function cssColorToRgba(cssColor) {
    let probe = document.createElement("div");
    probe.style.color = cssColor;
    document.body.appendChild(probe);
    let computed = getComputedStyle(probe).color;
    document.body.removeChild(probe);
    let match = computed.match(/rgba?\((\d+), (\d+), (\d+)(?:, (\d*\.?\d+))?\)/);
    if (!match) {
      return [1, 1, 1, 1];
    }
    let r = parseInt(match[1], 10) / 255;
    let g = parseInt(match[2], 10) / 255;
    let b = parseInt(match[3], 10) / 255;
    let a = match[4] !== undefined ? parseFloat(match[4]) : 1;
    return [r, g, b, a];
  }

  // ===== WebGL2 hooks: shader injection + drawElements proxy (chams, wireframe, hands, transparent shield, no smoke) =====
  function installWebGLHooks() {
    let PLAYER_INDEX_COUNT = 3216;
    let HANDS_INDEX_COUNT = 936;
    let SHIELD_INDEX_COUNT = 2220;
    let gl2Proto = WebGL2RenderingContext.prototype;
    gl2Proto.shaderSource = new Proxy(gl2Proto.shaderSource, {
      apply(target, gl, [shader, source]) {
        if (source.includes("gl_Position")) {
          source = source.replace(
            "void main",
            "\n          uniform bool enabled;\n          uniform vec4 customColor;\n          void main\n        ",
          );
        }
        let outputVar = null;
        if (source.includes("SV_Target0")) {
          outputVar = "SV_Target0";
        }
        if (source.includes("fragColor")) {
          outputVar = "fragColor";
        }
        if (source.includes("gl_FragColor")) {
          outputVar = "gl_FragColor";
        }
        if (outputVar) {
          source = source.replace(
            "void main",
            "\n          uniform bool enabled;\n          uniform vec4 customColor;\n          void main\n        ",
          );
          source = source.replace(
            /return\s*;/g,
            "\n            if (enabled) {\n              " +
              outputVar +
              " = customColor;\n            }\n            return;\n          ",
          );
        }
        return Reflect.apply(target, gl, [shader, source]);
      },
    });
    gl2Proto.drawElements = new Proxy(gl2Proto.drawElements, {
      apply(target, gl, args) {
        let [mode, count] = args;
        let program = gl.getParameter(gl.CURRENT_PROGRAM);
        if (!program) {
          return Reflect.apply(target, gl, args);
        }
        if (count === 1800 && config.visuals.nosmoke) {
          args[0] = gl.POINTS;
        }
        if (!program.uniforms) {
          program.uniforms = {
            enabled: gl.getUniformLocation(program, "enabled"),
            color: gl.getUniformLocation(program, "customColor"),
          };
        }
        let isPlayer = count === PLAYER_INDEX_COUNT;
        let isHands = count === HANDS_INDEX_COUNT;
        let isShield = count === SHIELD_INDEX_COUNT;
        if (!isPlayer && !isHands && !isShield) {
          if (program.uniforms.enabled) {
            gl.uniform1i(program.uniforms.enabled, 0);
          }
          return Reflect.apply(target, gl, args);
        }
        if (isShield) {
          if (!config.visuals.transparentshield) {
            gl.uniform1i(program.uniforms.enabled, 0);
            return Reflect.apply(target, gl, args);
          }
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.depthMask(false);
          gl.uniform1i(program.uniforms.enabled, 1);
          gl.uniform4f(program.uniforms.color, 1, 1, 1, 0.3);
          let result = Reflect.apply(target, gl, args);
          gl.uniform1i(program.uniforms.enabled, 0);
          gl.depthMask(true);
          gl.disable(gl.BLEND);
          return result;
        }
        if (isHands) {
          if (!config.visuals.hands) {
            gl.uniform1i(program.uniforms.enabled, 0);
            return Reflect.apply(target, gl, args);
          }
          let [r, g, b, a] = cssColorToRgba(config.visuals.handscolor);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.depthMask(false);
          gl.uniform1i(program.uniforms.enabled, 1);
          gl.uniform4f(program.uniforms.color, r, g, b, a);
          let result = Reflect.apply(target, gl, args);
          gl.uniform1i(program.uniforms.enabled, 0);
          gl.depthMask(true);
          gl.disable(gl.BLEND);
          return result;
        }
        if (!config.visuals.chams) {
          gl.uniform1i(program.uniforms.enabled, 0);
          return Reflect.apply(target, gl, args);
        }
        {
          let [r, g, b, a] = cssColorToRgba(config.visuals.playerhiddencolor);
          gl.disable(gl.DEPTH_TEST);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.enable(gl.POLYGON_OFFSET_FILL);
          gl.polygonOffset(-1, -1);
          gl.uniform1i(program.uniforms.enabled, 1);
          gl.uniform4f(program.uniforms.color, r, g, b, a);
          if (config.visuals.wireframe) {
            args[0] = gl.LINES;
          }
          Reflect.apply(target, gl, args);
          gl.uniform1i(program.uniforms.enabled, 0);
          gl.disable(gl.POLYGON_OFFSET_FILL);
          gl.disable(gl.BLEND);
        }
        {
          let [r, g, b, a] = cssColorToRgba(config.visuals.playervisiblecolor);
          gl.enable(gl.DEPTH_TEST);
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.enable(gl.POLYGON_OFFSET_FILL);
          gl.polygonOffset(-1, -1);
          gl.uniform1i(program.uniforms.enabled, 1);
          gl.uniform4f(program.uniforms.color, r, g, b, a);
          if (config.visuals.wireframe) {
            args[0] = gl.LINES;
          }
          let result = Reflect.apply(target, gl, args);
          gl.uniform1i(program.uniforms.enabled, 0);
          gl.disable(gl.POLYGON_OFFSET_FILL);
          gl.disable(gl.BLEND);
          return result;
        }
      },
    });
  }

  // ===== Entry point =====
  var menu = new RecteMenu("Vecte", "1.0.0");
  var playersSection = null;
  var AIM_KEY_OPTIONS = [
    "RightMouse",
    "LeftMouse",
    "MiddleMouse",
    "BackMouse",
    "ForwardMouse",
    "Shift",
    "Ctrl",
    "Alt",
    "Space",
    "CapsLock",
    "Tab",
    "Q",
    "E",
    "R",
    "F",
    "V",
    "B",
    "0",
    "Insert",
    "F9",
    "O",
    "I",
    "P",
    "Backquote",
  ];
  clearUnityCache().then((unused) => {
    installWebSocketHook();
    installMovementHooks();
    installPlayerHooks();
    installGunHooks();
    installWebGLHooks();
    console.log("running");
    document.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === config.settings.toggle.toLowerCase()) {
        menu.togglevis();
      }
    });
    let isFirefox = typeof InstallTrigger < "u";
    menu.addTab("Aimbot", (panel) => {
      let section = menu.addSection(panel, "Aimbot");
      menu.addToggleRow(section, "Aimbot", config.rage, "aimbot");
      menu.addSelectRow(section, "Aim Type", ["Aimbot", "Magic Bullet"], config.rage, "aimbottype");
      menu.addSelectRow(
        section,
        "Aim Target",
        ["Center of screen", "Lowest Health", "Closest"],
        config.rage,
        "aimtype",
      );
      menu.addSliderRow(section, "Target Switch Interval", config.rage, "targetswitchinterval", 0, 2, 0.1);
      menu.addSelectRow(section, "Aim Key", AIM_KEY_OPTIONS, config.rage, "aimkey");
      menu.addSliderRow(section, "Aim Speed", config.rage, "aimspeed", 0.1, 1, 0.1);
      menu.addSelectRow(section, "Aim Bone", ["Head", "Legs", "Body"], config.rage, "aimbone");
      menu.addToggleRow(section, "Fov", config.visuals, "fov");
      menu.addSliderRow(section, "Fov Size", config.visuals, "fovsize", 1, 1000, 1);
      menu.addColorRow(section, "Fov Color", config.visuals, "fovcolor");
      menu.addToggleRow(section, "Fov Rainbow", config.visuals, "fovrainbow");
      menu.addToggleRow(section, "Sticky Targeting", config.rage, "stickytargeting");
    });
    menu.addTab("Player", (panel) => {
      let othersSection = menu.addSection(panel, "Others");
      menu.addToggleRow(othersSection, "No Riot Shield", config.rage, "noshield");
      menu.addToggleRow(othersSection, "KillAll", config.rage, "killall");
      menu.addButton(
        othersSection,
        "God Mode Everyone",
        {
          text: "Press when everyone is alive (spam = kick)",
        },
        "text",
        (target, key, button) => {
          godModeEveryone();
        },
      );
      let selfSection = menu.addSection(panel, "Self");
      menu.addButton(
        othersSection,
        "God Mode",
        {
          text: "Press each time you enter a game",
        },
        "text",
        (target, key, button) => {
          godModeSelf();
        },
      );
      menu.addToggleRow(selfSection, "Friendly Fire", config.rage, "friendlyfire");
      menu.addToggleRow(selfSection, "No Gravity", config.rage, "nograv");
      menu.addSliderRow(selfSection, "Slope Angle", config.rage, "spider", 0, 360, 1);
      menu.addSliderRow(selfSection, "Step Height", config.rage, "stepheight", 0, 50, 0.1);
      menu.addSliderRow(selfSection, "Jump Height", config.rage, "jumpheight", 0, 200, 1);
      menu.addSliderRow(selfSection, "Gravity", config.rage, "grav", -50, 50, 1);
      menu.addToggleRow(selfSection, "Invisibility", config.rage, "invisibility");
      menu.addToggleRow(selfSection, "Fly", config.rage, "fly");
      menu.addSliderRow(selfSection, "Fly Speed", config.rage, "flyspeed", 100, 1000, 100);
      menu.addToggleRow(selfSection, "No Knockback", config.rage, "noknockback");
      menu.addSliderRow(selfSection, "Speed", config.rage, "speed", 0, 100, 0.1);
    });
    menu.addTab("Gun", (panel) => {
      let gunSection = menu.addSection(panel, "Gun");
      menu.addToggleRow(gunSection, "Hover to Kill", config.rage, "hovertokill");
      menu.addToggleRow(gunSection, "Bullet Hit Random", config.rage, "bulletshitrandom");
      menu.addToggleRow(gunSection, "WallBang", config.rage, "shootthroughwalls");
      menu.addToggleRow(gunSection, "No Ability Cooldown", config.rage, "nocooldown");
      menu.addSliderRow(gunSection, "Damage", config.rage, "damage", 0, 150, 1);
      menu.addToggleRow(gunSection, "One Shot", config.rage, "oneshot");
      menu.addToggleRow(gunSection, "Fast Switch", config.rage, "fastswitch");
      menu.addToggleRow(gunSection, "Infinite Range", config.rage, "range");
      menu.addToggleRow(gunSection, "Infinite Ammo", config.rage, "infammo");
      menu.addToggleRow(gunSection, "Fire Rate", config.rage, "firerate");
      menu.addToggleRow(gunSection, "Auto Fire", config.rage, "autofire");
      menu.addToggleRow(gunSection, "No Recoil", config.rage, "norecoil");
      let loadoutSection = menu.addSection(panel, "Loadout");
      menu.addSelectRow(loadoutSection, "Primary Weapon", WEAPON_NAMES, config.loadout, "primary");
      menu.addSelectRow(loadoutSection, "Secondary Weapon", WEAPON_NAMES, config.loadout, "secondary");
      menu.addSelectRow(loadoutSection, "Melee Weapon", WEAPON_NAMES, config.loadout, "melee");
      menu.addSelectRow(loadoutSection, "Grenades", WEAPON_NAMES, config.loadout, "grenades");
      menu.addButton(loadoutSection, "Apply Loadout", {}, "text", (target, key, button) => {
        applyLoadout();
      });
    });
    menu.addTab("Visuals", (panel) => {
      let utilitySection = menu.addSection(panel, "Utility");
      menu.addToggleRow(utilitySection, "No Flash", config.visuals, "hideflash");
      menu.addToggleRow(utilitySection, "No Smoke", config.visuals, "nosmoke");
      menu.addToggleRow(utilitySection, "Transparent Shield", config.visuals, "transparentshield");
      let chamsSection = menu.addSection(panel, "Chams");
      menu.addToggleRow(chamsSection, "Hands", config.visuals, "hands");
      menu.addColorRow(chamsSection, "Hands Color", config.visuals, "handscolor");
      menu.addToggleRow(chamsSection, "Chams", config.visuals, "chams");
      menu.addToggleRow(chamsSection, "Chams Wireframe", config.visuals, "wireframe");
      menu.addDualColorRow(
        chamsSection,
        "Player Visible Color",
        config.visuals,
        "playervisiblecolor",
        "playerhiddencolor",
      );
      let espSection = menu.addSection(panel, "ESP");
      menu.addToggleRow(espSection, "Global Esp", config.visuals, "esp");
      menu.addToggleRow(espSection, "Box ESP", config.visuals, "box");
      menu.addSliderRow(espSection, "Box Thickness", config.visuals, "boxthickness", 1, 10, 0.1);
      menu.addColorRow(espSection, "Box Color", config.visuals, "boxcolor");
      menu.addToggleRow(espSection, "Box Rainbow", config.visuals, "boxrainbow");
      menu.addToggleRow(espSection, "Corner Box ESP", config.visuals, "cornerbox");
      menu.addSliderRow(espSection, "Corner Box Thickness", config.visuals, "cornerboxthickness", 1, 10, 0.1);
      menu.addColorRow(espSection, "Corner Box Color", config.visuals, "cornerboxcolor");
      menu.addToggleRow(espSection, "Corner Box Rainbow", config.visuals, "cornerboxrainbow");
      menu.addToggleRow(espSection, "Skeleton ESP", config.visuals, "skeleton");
      menu.addSliderRow(espSection, "Skeleton Thickness", config.visuals, "skeletonthickness", 1, 10, 0.1);
      menu.addColorRow(espSection, "Skeleton Color", config.visuals, "skeletoncolor");
      menu.addToggleRow(espSection, "Skeleton Rainbow", config.visuals, "skeletonrainbow");
      menu.addToggleRow(espSection, "Filled Box ESP", config.visuals, "filledbox");
      menu.addColorRow(espSection, "Filled Box Color", config.visuals, "filledboxcolor");
      menu.addToggleRow(espSection, "Filled Box Rainbow", config.visuals, "filledboxrainbow");
      menu.addToggleRow(espSection, "Tracer ESP", config.visuals, "tracer");
      menu.addSliderRow(espSection, "Tracer Thickness", config.visuals, "tracerthickness", 1, 10, 0.1);
      menu.addColorRow(espSection, "Tracer Color", config.visuals, "tracercolor");
      menu.addSelectRow(espSection, "Tracer From", ["Bottom Center", "Top Center"], config.visuals, "tracerfrom");
      menu.addSelectRow(espSection, "Tracer To", ["Feet", "Head"], config.visuals, "tracerto");
      menu.addToggleRow(espSection, "Tracer Rainbow", config.visuals, "tracerrainbow");
      let playerInfoSection = menu.addSection(panel, "Player Info");
      menu.addSelectRow(playerInfoSection, "User Info Location", ["Feet", "Head"], config.visuals, "userinfolocation");
      menu.addToggleRow(playerInfoSection, "Name ESP", config.visuals, "name");
      menu.addSliderRow(playerInfoSection, "Name Size", config.visuals, "namesize", 1, 32, 0.1);
      menu.addColorRow(playerInfoSection, "Name Color", config.visuals, "namecolor");
      menu.addToggleRow(playerInfoSection, "Name Rainbow", config.visuals, "namerainbow");
      menu.addToggleRow(playerInfoSection, "Health Text", config.visuals, "healthtext");
      menu.addToggleRow(playerInfoSection, "Health Bar", config.visuals, "healthbar");
      menu.addToggleRow(playerInfoSection, "Health ESP", config.visuals, "healthesp");
      menu.addSliderRow(playerInfoSection, "Health Size", config.visuals, "healthespsize", 1, 32, 0.1);
      menu.addColorRow(playerInfoSection, "Health Color", config.visuals, "healthespcolor");
      menu.addToggleRow(playerInfoSection, "Health Rainbow", config.visuals, "healthesprainbow");
      menu.addToggleRow(playerInfoSection, "Distance ESP", config.visuals, "distanceesp");
      menu.addSliderRow(playerInfoSection, "Distance Size", config.visuals, "distancesize", 1, 32, 0.1);
      menu.addColorRow(playerInfoSection, "Distance Color", config.visuals, "distancecolor");
      menu.addToggleRow(playerInfoSection, "Distance Rainbow", config.visuals, "distancerainbow");
      menu.addToggleRow(playerInfoSection, "Gun ESP", config.visuals, "gunesp");
      menu.addSliderRow(playerInfoSection, "Gun Size", config.visuals, "gunespsize", 1, 32, 0.1);
      menu.addColorRow(playerInfoSection, "Gun Color", config.visuals, "gunespcolor");
      menu.addToggleRow(playerInfoSection, "Gun Rainbow", config.visuals, "gunrainbow");
    });
    menu.addTab("Misc", (panel) => {
      let miscSection = menu.addSection(panel, "Misc");
      if (isFirefox) {
        menu.addToggleRow(miscSection, "Crash", config.rage, "crash");
        menu.addToggleRow(miscSection, "Spinbot", config.rage, "spinbot");
      }
      menu.addSliderRow(miscSection, "Neck Rotation", config.rage, "neckrotation", -128, 127, 1);
      menu.addToggleRow(miscSection, "Instant Respawn", config.rage, "instantrespawn");
      menu.addToggleRow(miscSection, "Chat Spam", config.rage, "chatspam");
      menu.addToggleRow(miscSection, "Roast All", config.rage, "roastall");
    });
    menu.addTab("Players", (panel) => {
      function updateRadar() {
        radar.setMe(localPlayer);
        radar.setPlayers(
          players.map((player) => ({
            x: player.pos.x,
            y: player.pos.z,
            color: "#ff4d4d",
          })),
        );
        if (localPlayer) {
          let yaw = Math.atan2(-localPlayer.forward.x, -localPlayer.forward.z);
          radar.setYaw((yaw * 180) / Math.PI);
        }
        radar.update();
        requestAnimationFrame(updateRadar);
      }
      let radar = menu.addRadarBox(null, {
        size: 220,
        range: 200,
      });
      let radarSection = menu.addSection(panel, "Radar");
      menu.addButton(
        radarSection,
        "Toggle Radar",
        {
          text: "Toggle Radar",
        },
        "text",
        (target, key, button) => {
          let isVisible = radar.element.style.display !== "none";
          radar.toggle(!isVisible);
        },
      );
      updateRadar();
      playersSection = menu.addSection(panel, "Players");
    });
    menu.addTab("Settings", (panel) => {
      let settingsSection = menu.addSection(panel, "Settings");
      menu.addSelectRow(settingsSection, "Menu Toggle Key", config.settings.keyOptions, config.settings, "toggle");
      menu.addSelectRow(settingsSection, "Godmode Key", config.settings.keyOptions, config.settings, "godmodekey");
      menu.addSelectRow(settingsSection, "Wallbang Key", config.settings.keyOptions, config.settings, "wallbangkey");
      menu.addSelectRow(settingsSection, "Chams Key", config.settings.keyOptions, config.settings, "chamskey");
      menu.addSelectRow(settingsSection, "ESP Key", config.settings.keyOptions, config.settings, "espkey");
      menu.addSelectRow(settingsSection, "Loadout Key", config.settings.keyOptions, config.settings, "loadoutkey");
      menu.addSelectRow(settingsSection, "Invisibility Key", config.settings.keyOptions, config.settings, "inviskey");
      menu.addSelectRow(settingsSection, "Fly Key", config.settings.keyOptions, config.settings, "flykey");
      if (isFirefox) {
        menu.addSelectRow(settingsSection, "Spinbot Key", config.settings.keyOptions, config.settings, "spinbotkey");
      }
    });
    menu.addTab("Credits", (panel) => {
      let creditsSection = menu.addSection(panel, "Credits");
      menu.addButton(
        creditsSection,
        "Discord",
        {
          text: "Join our Discord!",
        },
        "text",
        (target, key, button) => {
          window.open("https://recte.cc/invite", "_blank");
        },
      );
    });
    isolateTextInputKeys();
    mainLoop();
  });
  var lastSpinbotTime = 0;
  var SPINBOT_INTERVAL_MS = 35;
  var godmodeKeyLatched = false;
  var wallbangKeyLatched = false;
  var chamsKeyLatched = false;
  var espKeyLatched = false;
  var loadoutKeyLatched = false;
  var invisKeyLatched = false;
  var flyKeyLatched = false;
  var spinbotKeyLatched = false;
  var lastChatSpamTime = 0;
  var lastRoastTime = 0;
  var CHAT_SPAM_INTERVAL_MS = 1500;
  var ROAST_INTERVAL_MS = 1500;
})();
