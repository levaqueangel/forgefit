# APXFITNESS — ROADMAP COMPLÈTE
> Généré le 2026-06-08 — Liste exhaustive de tout ce qui doit être fait, point par point.

---

## 🔴 PRIORITÉ 1 — BLOQUANT / PERTE D'ARGENT DIRECTE

- [ ] **1. Vérifier le domaine `apxfitness.fr` sur Resend**
  - Tous les emails partent de `onboarding@resend.dev` → spam
  - Confirmation paiement, activation, check-in hebdo, relance J7, bilan J28 non reçus

- [ ] **2. Pointer `apxfitness.fr` vers Vercel**
  - Site sur `apxfitness-brown.vercel.app` → URL non professionnelle dans les emails et liens Stripe

- [ ] **3. Recharger les crédits Anthropic**
  - Génération de programme IA bloquée (fonctionnalité vendue)

- [x] **4. Supprimer les docs Firestore "fantômes"** ✅ 2026-06-08
  - Webhook corrigé → ne crée plus jamais de doc clients
  - Docs fantômes existants supprimés via bouton coach dashboard

- [x] **5. Corriger `NEXT_PUBLIC_COACH_EMAIL` → `COACH_EMAIL`** ✅ 2026-06-08
  - 7 API routes corrigées → lisent COACH_EMAIL (sans préfixe) en priorité
  - Variable COACH_EMAIL ajoutée sur Vercel
  - coach/page.js et recettes/page.js gardent NEXT_PUBLIC_ (côté client)

---

## 🟠 PRIORITÉ 2 — BUGS FONCTIONNELS

- [x] **6. Bug plan Elite — casse `"Elite"` vs `"elite"`** ✅ 2026-06-08
  - `DashboardTab.js` ligne 186 : `clientData?.plan?.toLowerCase() === "elite"` (corrigé)
  - Le plan est stocké en minuscules dans Firestore → bloc "Espace Elite" maintenant visible

- [ ] **7. Webhook Stripe — Arrêter la création de docs fantômes**
  - Supprimer le bloc de création `clients/{randomId}` dans `stripe-webhook/route.js`
  - Seul `activate-client` doit créer des docs clients

- [x] **8. `DashboardTab.js` — Bug séances index 0 et 1 non cochables** ✅ 2026-06-08
  - Ligne 75 : `if(seanceDone[i]) return;` — supprimé `||i<2` qui bloquait les 2 premières séances

- [x] **9. Prix Stripe hardcodés dans le code** ✅ 2026-06-08
  - `stripe-checkout/route.js` : lit `PRICE_STARTER`, `PRICE_FORGE`, `PRICE_ELITE` depuis l'env
  - Fallback sur 4900 / 12900 / 24900 si variables non définies → pas de breaking change

- [x] **10. `repas/route.js` — Champ `description` vide si override photo** ✅ 2026-06-08
  - `repas/route.js` : fallback `description?.trim() || analyse?.nom?.trim() || "Repas scanné"`
  - `ScanRepas.js` : `result.nom?.trim() || "Repas scanné"` — journal jamais vide

- [x] **11. `export-clients/route.js` — `orderBy("createdAt")` instable** ✅ 2026-06-08
  - Supprimé `orderBy("createdAt")` → récupère tous les docs sans exclusion
  - Tri JS côté serveur avec fallback `createdAt || activatedAt`
  - Colonne "Date inscription" affiche aussi `activatedAt` si `createdAt` absent

- [x] **12. Email check-in — Faute d'apostrophe** ✅ 2026-06-08
  - `cron/checkin-hebdo/route.js` ligne 55 : `"d'entraînement"` corrigé

- [x] **13. Crons — Horaire UTC vs heure française** ✅ 2026-06-08
  - Décalé à 07:00 UTC → 9h en été (UTC+2), 8h en hiver (UTC+1) — heure idéale
  - relance-j7: 07h, recap-j28: 08h, relance-abandon: 09h, checkin-hebdo lundi: 07h

---

## 🟡 PRIORITÉ 3 — SÉCURITÉ ET ROBUSTESSE

- [x] **14. Rate limiter → Redis Upstash** ✅ 2026-06-08
  - rateLimit.js réécrit : sliding window Redis si UPSTASH_REDIS_REST_URL/TOKEN présents
  - Fallback automatique mémoire si Redis absent → zéro breaking change
  - await ajouté sur 27 appels checkRateLimit dans 20 fichiers
  - À faire : créer base Upstash + ajouter 2 variables sur Vercel

- [x] **15. `referral/route.js` — Pas de vérification Auth** ✅ déjà corrigé
  - POST : verifyAuthToken + decoded.uid !== clientId (403 si mismatch)
  - GET : public intentionnel (visiteur non connecté doit pouvoir valider un code ref)

- [x] **16. Chatbot — Rate limit uniquement par IP** ✅ 2026-06-08
  - checkRateLimitDouble(ip, uid, 30, 20) si UID présent → bloque par IP ET par compte
  - Fallback checkRateLimit(ip) si non connecté

- [x] **17. `ScanRepas.js` — Pas de vérification taille fichier avant compression** ✅ 2026-06-08
  - Rejet immédiat si file.size > 20MB avant compressImage → pas de blocage navigateur

- [x] **18. Variables d'env — Pas de validation au démarrage** ✅ 2026-06-08
  - firebase-admin.js : validateEnv() vérifie FIREBASE_* + ANTHROPIC_API_KEY au 1er appel
  - Lève une erreur explicite avec liste des variables manquantes

- [x] **19. Règles Firestore `messages` — Audit post-modification** ✅ 2026-06-08
  - Rules déjà correctes : resource.data.clientId == request.auth.uid
  - Bonus : suppression du doublon "Elite" dans community (plan stocké en lowercase)

---

## 🔵 PRIORITÉ 4 — FONCTIONNALITÉS MANQUANTES

- [x] **20. Favoris Recettes → Firestore (pas localStorage)** ✅ 2026-06-08
  - RecettesTab reçoit `user` prop → charge recettesFavoris depuis Firestore au montage
  - toggleFav : sauvegarde localStorage (immédiat) + Firestore (async)
  - Fallback silencieux sur localStorage si non connecté ou erreur réseau

- [x] **21. Historique chatbot IA → Firestore** ✅ 2026-06-08
  - Chargement chatHistory depuis Firestore au montage
  - Sauvegarde après chaque échange (hors streaming) → localStorage + Firestore
  - clearHistory efface aussi Firestore
  - 30 derniers messages max (MAX_HISTORY)

- [x] **22. Éditeur de programme manuel — Coach dashboard** ✅ 2026-06-08
  - ProgrammeManuelEditor.js : séances + exercices + nutrition + méta
  - Toggle IA / Manuel dans la modale programme du coach
  - sauvegarderProgrammeManuel() → même API save-programme que le mode IA

- [x] **23. Notifications push PWA — Triggers à configurer** ✅ 2026-06-08
  - Trigger 1 (message coach) : déjà en place dans notify-client/route.js
  - Trigger 2 (rappel séance) : cron/rappel-seance/route.js → 07:00 UTC chaque jour
  - Trigger 3 (streak) : seance/route.js → push à 7/14/30 jours consécutifs

- [x] **24. Dashboard coach — Graphiques progression client** ✅ 2026-06-08
  - ClientProgressCharts.js : SVG pur (sparkline + barres horizontales)
  - Poids (sparkline + delta), calories 7j (sparkline), séances top 5 (barres), streak + total
  - Intégré dans le panneau client du coach dashboard

- [x] **25. Stripe Customer Portal** ✅ 2026-06-08
  - api/stripe-portal/route.js → billingPortal.sessions.create
  - Lookup stripeCustomerId par email si absent, sauvegarde pour prochaines fois
  - Bouton 🧾 dans la nav client → redirige vers le portail Stripe

- [x] **26. Page `/paiement-succes` — Vérifier qu'elle existe** ✅ déjà en place
  - app/paiement-succes/page.js existe avec messages adaptés par plan

- [ ] **27. Programme client — Affichage structuré (pas `<pre>`)**
  - Actuellement affiché en texte monospace brut dans `ProgrammeTab.js`
  - Créer un affichage carte par séance, exercices en liste visuelle

- [ ] **28. GIFs / vidéos démonstration exercices**
  - `ExerciceGif.js` existe mais sans source de données connectée
  - Connecter ExerciseDB API ou créer bibliothèque statique des 40 exercices courants

- [ ] **29. Timer de repos — Son de notification (fallback iOS)**
  - `navigator.vibrate()` non supporté sur iOS
  - Ajouter un son via `AudioContext` ou `<audio>` comme fallback

- [ ] **30. Journal repas — Bouton supprimer une entrée**
  - Impossible de corriger une erreur de saisie
  - Ajouter bouton suppression sur chaque entrée de `repasJournal`

- [ ] **31. Nutrition — Barre progression "consommé vs objectif"**
  - Les macros cibles et consommées sont dans deux endroits différents
  - Afficher en temps réel : consommé / objectif pour calories, protéines, glucides, lipides

- [ ] **32. Corps Journal — Graphique évolution du poids**
  - Journal de mesures sans courbe de progression
  - Ajouter sparkline poids sur 30/60/90 jours

---

## ⚪ PRIORITÉ 5 — OPTIMISATIONS TECHNIQUES

- [ ] **33. `coach/page.js` — Refactoriser en composants séparés**
  - 1500+ lignes dans un seul fichier
  - Créer : `MessagesPanel.js`, `ProgrammeModal.js`, `CommandesTab.js`, `StatsTab.js`

- [ ] **34. `repas-photo` — Upload Firebase Storage au lieu de base64 JSON**
  - Image ~1.4MB dans le body HTTP → lent et risque de timeout
  - Upload Storage → envoyer URL à Anthropic

- [ ] **35. Sous-collections Firestore — `repasJournal` et `seanceHistorique`**
  - Arrays dans le doc principal → chaque lecture charge tout
  - Migrer en sous-collections à mesure que la base grossit

- [ ] **36. Cache programmes générés — `/api/generate`**
  - Deux appels identiques = deux factures Anthropic
  - Ajouter cache 24h basé sur hash des paramètres (Vercel KV ou Redis)

- [ ] **37. `rateLimit.js` — Limite taille du Map**
  - Peut grossir indéfiniment entre nettoyages
  - Ajouter `if (WINDOWS.size > 10000) WINDOWS.clear()`

- [ ] **38. Chatbot — Routing Haiku → Sonnet selon complexité**
  - Questions techniques avancées → Haiku insuffisant
  - Détecter complexité (longueur, mots-clés) et router vers Sonnet

- [ ] **39. `vercel.json` — Ajouter security headers**
  - Manquent : `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`

- [ ] **40. PWA — Stratégie cache Service Worker**
  - Vérifier précache des assets critiques
  - App fonctionnelle offline en mode lecture programme

- [ ] **41. `RecettesTab.js` — Fallback image si 404**
  - Ajouter `onError` sur `NextImage` pour image de remplacement

- [ ] **42. Export CSV — Compatibilité séparateur international**
  - `;` fonctionne sous Excel France, pas sous Excel anglais/Mac
  - Ajouter `sep=;` en première ligne ou option virgule

- [ ] **43. Webhook Stripe — Idempotency check**
  - Retry Stripe peut créer deux `orders` pour une même session
  - Vérifier `stripeSessionId` avant création

- [ ] **44. Emails — Template responsive mobile**
  - Tables HTML largeur fixe 600px → peut déborder sur mobile
  - Ajouter `max-width: 100%` et media queries email

---

## 📊 SUIVI

| Priorité | Total | Fait | Restant |
|----------|-------|------|---------|
| 🔴 P1 Bloquants | 5 | 2 | 3 |
| 🟠 P2 Bugs | 8 | 7 | 1 |
| 🟡 P3 Sécurité | 6 | 6 | 0 |
| 🔵 P4 Features | 13 | 5 | 8 |
| ⚪ P5 Optim | 9 | 0 | 9 |
| **TOTAL** | **41** | **20** | **21** |
