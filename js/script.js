// Funzione eseguita solo quando tutto il DOM è stato caricato.
document.addEventListener('DOMContentLoaded', (event) => {
    
    // --- 1. VARIABILI GLOBALI E CONDIVISE ---
    
    // Variabili audio
    const ambientAudio = document.getElementById('ambient-audio');
    const haikuAudio = document.getElementById('haiku-audio'); 
    const scrollSound = document.getElementById('scroll-sound'); 
    const finalAudio = document.getElementById('final-audio'); 
    const AMBIENT_VOLUME_NORMAL = 0.5;
    
    // Variabili Segrete (SIMULAZIONE .env) - !!! CAMBIA QUESTI VALORI !!!
    const CODICE_SEGRETO_CORRETTO = "BERSERK"; 
    const CODICE_PS_STORE = "ABCD-EFGH-IJKL-MNPQR"; 
    
    // --- Funzione Helper per volume (Fade in/out) ---
    function setAmbientVolume(targetVolume) {
        if (typeof gsap !== 'undefined' && ambientAudio) {
            gsap.to(ambientAudio, { volume: targetVolume, duration: 1.5 });
        } else if (ambientAudio) {
            ambientAudio.volume = targetVolume;
        }
    }

    // --- Funzione Helper per avviare l'audio di srotolamento (MIGLIORATA) ---
    function playScrollSound() {
        if (scrollSound && scrollSound.readyState >= 3) {
            scrollSound.currentTime = 0; 
            scrollSound.volume = 0.8; 
            scrollSound.play().catch(e => console.warn("Errore riproduzione srotolamento:", e));
        } else if (scrollSound) {
            scrollSound.addEventListener('canplaythrough', function handler() {
                scrollSound.currentTime = 0; 
                scrollSound.volume = 0.8; 
                scrollSound.play().catch(e => console.warn("Errore riproduzione srotolamento:", e));
                scrollSound.removeEventListener('canplaythrough', handler);
            });
            scrollSound.load();
        }
    }
    
    // --- Funzione per sblocco audio forzato (primo click/touch) ---
    function enableAudio() {
        if (ambientAudio && ambientAudio.paused) {
            ambientAudio.volume = 0.0;
            ambientAudio.play().then(() => {
                setAmbientVolume(AMBIENT_VOLUME_NORMAL);
            }).catch(() => {
                console.warn("Riproduzione audio ambientale non riuscita o bloccata.");
            });
        }
        // Rimuove gli ascoltatori una volta che l'audio è partito
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
    }
    
    // Tentativo di inizializzazione audio non restrittivo (solo listener di sblocco)
    if (ambientAudio) {
        document.addEventListener('click', enableAudio);
        document.addEventListener('touchstart', enableAudio);
    }
    
    // Funzione di avvio audio per verifica.html e haiku.html
    function startAmbientAudio() {
        if (ambientAudio) {
             ambientAudio.volume = 0.0;
             ambientAudio.play().then(() => {
                 setAmbientVolume(AMBIENT_VOLUME_NORMAL);
             }).catch(() => {
                 console.warn("Riproduzione audio ambientale bloccata.");
             });
        }
    }


// =========================================================================
//                            LOGICA index.html (CON SOTTOTITOLI)
// =========================================================================
    
const btnStart = document.getElementById('btn-start');

if (btnStart) { // Se l'elemento 'btn-start' è presente, siamo in index.html
    
    if (typeof HOME_SUBTITLES === 'undefined') {
        console.error("ERRORE: Array HOME_SUBTITLES non trovato. Assicurati che js/sub.js sia incluso.");
        return;
    }
    
    const audioSection = document.getElementById('audio-section');
    const btnPlayTTS = document.getElementById('btn-play-tts');
    const mainTitle = document.getElementById('main-title');
    const interactionArea = document.getElementById('interaction-area');

    let nextSubtitleIndex = 0;
    let subtitleInterval = null;
    
    // Funzione gestita alla fine dell'audio
    function haikuEnded() {
        if (subtitleInterval) {
            clearInterval(subtitleInterval);
        }
        haikuAudio.removeEventListener('ended', haikuEnded);

        ambientAudio.play().catch(() => {});
        setAmbientVolume(AMBIENT_VOLUME_NORMAL);
        
        // Aggiorna l'interfaccia inserendo il pulsante 'Segui il Vento'
        interactionArea.innerHTML = `
            <p class="text-gold text-lg font-bold font-tsushima mb-3 animate-pulse">
                MESSAGGIO RIVELATO
            </p>
            
            <a id="link-reveal-inline" href="haiku.html">
                <button class="glass-button text-dark font-bold py-4 px-8 transform transition-all duration-300 hover:scale-[1.02] active:scale-95 text-lg tracking-widest uppercase shadow-lg">
                    SEGUI IL VENTO
                </button>
            </a>
        `;
    }

    // Funzione per mostrare il player e avviare l'audio
    function showHaikuPlayer(isError = false) {
        
        if (!haikuAudio) {
             interactionArea.innerHTML = `<p class="text-red-500 font-tsushima">Errore Audio: File sound.mp3 non trovato o bloccato.</p>`;
             return;
        }

        if (!isError) {
            // Interfaccia dei Sottotitoli in corso
            interactionArea.innerHTML = `
                <p id="haiku-message-progress" class="text-gold text-xl font-bold font-tsushima mb-3 opacity-0 transition-opacity duration-300">
                </p>
            `;
            
            const subtitleDisplay = document.getElementById('haiku-message-progress');
            
            // Diminuisce il volume ambientale prima di riprodurre il messaggio
            setAmbientVolume(0.1); 
            
            // Avvia la riproduzione
            haikuAudio.play().catch(() => showHaikuPlayer(true)); 
            
            nextSubtitleIndex = 0;

            // LOGICA DI SINCRONIZZAZIONE SOTTOTITOLI
            subtitleInterval = setInterval(() => {
                const currentTime = haikuAudio.currentTime;
                
                if (nextSubtitleIndex < HOME_SUBTITLES.length) {
                    const currentSubtitle = HOME_SUBTITLES[nextSubtitleIndex];
                    
                    if (currentTime >= currentSubtitle.time) {
                        
                        gsap.to(subtitleDisplay, { opacity: 0, duration: 0.1, onComplete: () => {
                            subtitleDisplay.textContent = currentSubtitle.text;
                            gsap.to(subtitleDisplay, { opacity: 1, duration: 0.5 });
                        }});

                        nextSubtitleIndex++;
                    }
                }
            }, 50);

            // FINE: GESTIONE AUDIO TERMINATO
            haikuAudio.addEventListener('ended', haikuEnded);

        }
    }
    
    // --- Click: INIZIA IL RITO (Transizione da Start a Ascolta) ---
    btnStart.addEventListener('click', () => {
        // Avvia l'audio ambientale grazie al primo click
        ambientAudio.muted = false;
        ambientAudio.volume = 0.0;
        ambientAudio.play().catch(() => {});
        setAmbientVolume(AMBIENT_VOLUME_NORMAL);
        
        gsap.to(btnStart, { opacity: 0, duration: 0.5 }); 
        
        setTimeout(() => {
            btnStart.style.display = 'none'; // Nasconde il bottone
            audioSection.classList.remove('hidden');
            gsap.to(audioSection, { opacity: 1, duration: 0.5 });
        }, 500); 
    });

    // --- Click: ASCOLTA (Passaggio 2 - INIZIO RIPRODUZIONE) ---
    if(btnPlayTTS) {
        btnPlayTTS.addEventListener('click', () => {
            showHaikuPlayer(); 
        });
    }
}

// =========================================================================
//                            LOGICA HAIKU.HTML
// =========================================================================

const pergamenaBox = document.getElementById('pergamena-box');

if (pergamenaBox) { 
    
    gsap.registerPlugin(Draggable); 
    
    // Tenta l'avvio asincrono dell'audio ambientale all'apertura della pagina
    startAmbientAudio();

    const finalReveal = document.getElementById('final-reveal');
    const latoSx = document.getElementById('lato-sx');
    const latoDx = document.getElementById('lato-dx');
    const haikuText = document.getElementById('haiku-text');
    const instructionInPergamena = document.getElementById('instruction-in-pergamena');

    const FINAL_HEIGHT = 280; 

    let isOpened = false;
    
    function finishOpening() {
        // Mostra il pulsante finale
        gsap.to(finalReveal, { opacity: 1, scale: 1, duration: 0.7, delay: 0.5, ease: "power2.out" });
    }
    
    // Animazione di apertura e chiusura dei lati
    const openingTween = gsap.timeline({ paused: true, onComplete: finishOpening });

    openingTween
        .to(instructionInPergamena, { opacity: 0, duration: 0.5, ease: "power2.inOut" }, 0)
        .to(pergamenaBox, { height: FINAL_HEIGHT, duration: 1.5, ease: "power2.inOut" }, 0) 
        .to(latoSx, { x: "-100%", duration: 1.5, ease: "power2.out" }, 0)
        .to(latoDx, { x: "100%", duration: 1.5, ease: "power2.out" }, 0)
        .to(haikuText, { opacity: 1, duration: 1.0, ease: "power2.inOut" }, 0.5);
    
    
    // --- DRAGGABLE GSAP per lo SWIPE (CON AUDIO SINCRONIZZATO!) ---
    Draggable.create(pergamenaBox, {
        type: "y", 
        trigger: pergamenaBox,
        inertia: true,
        bounds: { minY: 0, maxY: 100 }, 
        
        onDrag: function() {
            if (isOpened) return;
            let progress = Math.min(1, this.y / 80); 
            
            // Sincronizzazione: se si inizia il drag, avvia il suono
            if (progress > 0.01 && !isOpened) { 
                playScrollSound();
            }
            
            openingTween.progress(progress);

            if (progress > 0.5 && !isOpened) {
                isOpened = true;
                this.kill(); 
                openingTween.timeScale(1.5).play(); 
            }
        },
        onClick: function() {
            if (!isOpened) {
                isOpened = true;
                
                // ESEGUI LA RIPRODUZIONE SUBITO PRIMA DELL'ANIMAZIONE
                playScrollSound(); 
                
                openingTween.timeScale(1.5).play(); 
                this.kill();
            }
        }
    });
}
// =========================================================================
//                            LOGICA VERIFICA.HTML
// =========================================================================

    const btnSblocca = document.getElementById('btn-sblocca-dono');
    
    if (btnSblocca) { // Identificatore per verifica.html
        
        const inputCodice = document.getElementById('codice-verifica');
        const bloccoSicurezza = document.getElementById('blocco-sicurezza');
        const feedbackErrore = document.getElementById('feedback-errore');
        const rivelazioneFinale = document.getElementById('rivelazione-finale');
        
        // Elementi Toggle Password
        const togglePassword = document.getElementById('toggle-password');
        const eyeOpen = document.getElementById('eye-open');
        const eyeClosed = document.getElementById('eye-closed');
        
        // --- ANIMAZIONE IN ENTRATA GSAP (ORA AVVIA L'AUDIO) ---
        if (rivelazioneFinale) {
            gsap.to(rivelazioneFinale, { 
                opacity: 1, 
                scale: 1, 
                duration: 1.5, 
                ease: "elastic.out(1, 0.5)",
                onComplete: startAmbientAudio // Avvia l'audio ambientale a fine animazione
            });
        }
        
        // LOGICA TOGGLE PASSWORD (Occhio)
        if (togglePassword) {
            togglePassword.addEventListener('click', (e) => {
                e.preventDefault(); 
                const type = inputCodice.getAttribute('type') === 'password' ? 'text' : 'password';
                inputCodice.setAttribute('type', type);

                if (type === 'text') {
                    eyeOpen.classList.remove('hidden');
                    eyeClosed.classList.add('hidden');
                } else {
                    eyeOpen.classList.add('hidden');
                    eyeClosed.classList.remove('hidden');
                }
            });
        }


        // LOGICA SBLOCCO CODICE
        btnSblocca.addEventListener('click', () => {
            const codiceInserito = inputCodice.value.trim().toUpperCase(); 

            if (codiceInserito === CODICE_SEGRETO_CORRETTO.toUpperCase()) { 
                
                // *** SUCCESSO: REINDIRIZZA ALLA PAGINA FINALE ***
                sessionStorage.setItem('accesso-finale', 'true');

                gsap.to(rivelazioneFinale, { 
                    opacity: 0, 
                    y: -50, 
                    duration: 0.5, 
                    onComplete: () => {
                        window.location.href = "auguri.html"; // Reindirizza alla pagina finale
                    }
                });

            } else {
                // FAIL: Mostra messaggio di errore
                inputCodice.value = "";
                feedbackErrore.textContent = "Codice non valido. Il tuo Sentiero è bloccato.";
                gsap.fromTo(feedbackErrore, 
                    { opacity: 0, y: 5 }, 
                    { opacity: 1, y: 0, duration: 0.3, onComplete: () => {
                        gsap.to(feedbackErrore, { opacity: 0, delay: 2, duration: 0.5 });
                    }
                });
            }
        });
    }

// =========================================================================
//                            LOGICA AUGURI.HTML
// =========================================================================
    
    const psCodeDisplay = document.getElementById('ps-code');
    
    if (psCodeDisplay) { // Identificatore per auguri.html

        const hasPermission = sessionStorage.getItem('accesso-finale');
        
        if (!hasPermission) {
            // Se la chiave non esiste, reindirizza alla home o a una pagina di blocco
            window.location.href = "index.html"; 
            return; // Blocca l'esecuzione dello script
        }

        // --- L'ACCESSO È PERMESSO, CONTINUA CON IL GIOCO ---

        // Pulisci il permesso per un futuro utilizzo
        sessionStorage.removeItem('accesso-finale');

        // Inietta il codice segreto
        psCodeDisplay.textContent = CODICE_PS_STORE;
        
        // FUNZIONE PER AVVIARE L'AUDIO FINALE
        function startFinalAudio() {
            // Abbassa l'audio ambientale a zero
            setAmbientVolume(0);
            if (ambientAudio) ambientAudio.pause();

            if (finalAudio) {
                 finalAudio.volume = 0.0;
                 finalAudio.play().then(() => {
                     // Fade-in del nuovo audio
                     gsap.to(finalAudio, { volume: 0.8, duration: 2.0 });
                 }).catch(() => {
                     console.warn("Riproduzione audio finale bloccata o non riuscita.");
                 });
            }
        }
        
        // Animazione finale scenografica
        const containerFinale = document.getElementById('container-finale');
        if (containerFinale) {
             gsap.fromTo(containerFinale, 
                { opacity: 0, scale: 0.8 }, 
                { opacity: 1, scale: 1, duration: 1.5, ease: "elastic.out(1, 0.5)", onComplete: startFinalAudio } 
            );
        } else {
            // Se non c'è animazione, avvia subito l'audio
            startFinalAudio();
        }
        
        // Assicurati che l'audio sia abilitato al primo tocco
        enableAudio();
    }
});