// ==UserScript==
// @name         Recte
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Converted from Violentmonkey to Tampermonkey
// @author       recte.cc/invite
// @match        *://*.veck.io/*
// @run-at       document-idle
// @grant        none
// @require      https://raw.githubusercontent.com/TJGTA3/rectehoststuff/refs/heads/main/m39rectescriptloaderplsdontfailme
// ==/UserScript==

(async function() {
    'use strict';

    async function loadscript(url) {
        try {
            const res = await fetch(url);
            const code = await res.text();

            const func = new Function(code);
            func();
        } catch (e) {
            console.error("Failed to load script:", e);
        }
    }

    await loadscript("https://raw.githubusercontent.com/TJGTA3/rectehoststuff/refs/heads/main/dothething.js?1=" + Date.now());

    const del = indexedDB.deleteDatabase("UnityCache");
    del.onsuccess = () => console.log("UnityCache deleted");
    del.onerror = () => console.error("Failed to delete UnityCache");
    del.onblocked = () => console.warn("Delete blocked — close other tabs");

    function waitForGlobal(varName, interval = 50, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = () => {
                if (window[varName] !== undefined) {
                    resolve(window[varName]);
                } else if (Date.now() - start > timeout) {
                    reject(new Error(`${varName} not found after ${timeout}ms`));
                } else {
                    setTimeout(check, interval);
                }
            };
            check();
        });
    }

    try {
        await waitForGlobal("UnityWebModkit");

        const ctx = UnityWebModkit.Runtime.createPlugin({
            name: "Hax",
            version: "1.0.0",
            referencedAssemblies: [
                'ACTk.Runtime.dll',
                'GameAssembly.dll',
                'System.Runtime.InteropServices.dll',
                'mscorlib.dll',
                "PhotonRealtime.dll",
                'PhotonUnityNetworking.dll',
                'PhotonUnityNetworking.Utilities.dll',
                'Assembly-CSharp.dll',
                'UnityEngine.CoreModule.dll',
                'UnityEngine.PhysicsModule.dll',
                'StompyRobot.SRDebugger.dll',
                "UnityEngine.IMGUIModule.dll",
                "Photon3Unity3D.dll",
                'Unity.TextMeshPro.dll',
                'FishNet.Runtime.dll',
                'UnityEngine.AnimationModule.dll',
            ]
        });

        window.ctx = ctx;
        console.log("Plugin created successfully");

    } catch (err) {
        console.error("Error initializing plugin:", err);
    }

})();
