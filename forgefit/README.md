# ForgeFit 🏋️

Système complet de coaching fitness personnalisé avec génération de programmes par IA et envoi automatique par email.

## Stack
- **Next.js 14** (App Router)
- **Claude API** (génération des programmes)
- **Resend** (envoi des emails)

## Déploiement sur Vercel

### 1. Upload sur GitHub
1. Va sur github.com → New repository → nomme-le `forgefit`
2. Upload tous les fichiers de ce dossier
3. Commit

### 2. Déployer sur Vercel
1. Va sur vercel.com → New Project
2. Importe ton repo GitHub `forgefit`
3. Dans **Environment Variables**, ajoute :

| Clé | Valeur |
|-----|--------|
| `RESEND_API_KEY` | `re_ffVNqD6b_73xCJ9TAjGw87ojmjY8MPCS8` |
| `ANTHROPIC_API_KEY` | Ta clé Anthropic (sur console.anthropic.com) |
| `EMAIL_COACH` | `levaqueangel@gmail.com` |

4. Clique **Deploy** → ton site est en ligne en 2 minutes !

## Variables d'environnement

Copie `.env.example` en `.env.local` pour développer en local :
```
RESEND_API_KEY=...
ANTHROPIC_API_KEY=...
EMAIL_COACH=levaqueangel@gmail.com
```

## Prochaines étapes
- [ ] Ajouter Stripe pour les paiements
- [ ] Ajouter un nom de domaine custom (forgefit.fr)
- [ ] Mentions légales + CGV
