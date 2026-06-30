# Ateliê Jéssica Palomino — Landing Page

Página estática em HTML/CSS/JS puro. Abra `index.html` diretamente no navegador — não precisa de servidor.

---

## Checklist de substituições

Procure por `<!-- SUBSTITUA` no `index.html` para localizar cada ponto rapidamente.

### 1. Número de WhatsApp

Há **6 ocorrências** de `55XXXXXXXXXXX` na página. Substitua todas pelo seu número no formato internacional sem `+` ou espaços.

Exemplo: número `(11) 99999-9999` → `5511999999999`

```
Antes:  https://wa.me/55XXXXXXXXXXX
Depois: https://wa.me/5511999999999
```

### 2. Link do Instagram

Procure por `https://instagram.com/SEUPERFIL` (1 ocorrência no footer) e substitua pelo seu @.

```
Antes:  https://instagram.com/SEUPERFIL
Depois: https://instagram.com/atelie.jessicapalomino
```

### 3. Fotos — crie a pasta `assets/`

Crie uma pasta `assets/` na mesma pasta do `index.html` e adicione as imagens abaixo.

| Arquivo                        | Onde aparece         | Tamanho recomendado |
|-------------------------------|----------------------|---------------------|
| `assets/hero-tapecaria.jpg`   | Hero (imagem grande) | 900 × 1100 px       |
| `assets/jessica-palomino.jpg` | Seção Sobre          | 700 × 950 px        |
| `assets/nevoa-dourada.jpg`    | Card "Névoa Dourada" | 600 × 750 px        |
| `assets/terra-viva.jpg`       | Card "Terra Viva"    | 600 × 750 px        |
| `assets/bruma-serena.jpg`     | Card "Bruma Serena"  | 600 × 750 px        |

As imagens dos cards de produto são substituídas diretamente no HTML. Localize o comentário correspondente e adicione a tag `<img>` no lugar do placeholder:

```html
<!-- Antes (placeholder): -->
<span class="product-card__img-hint">...</span>

<!-- Depois (com imagem real): -->
<img src="./assets/nevoa-dourada.jpg" alt="Tapeçaria Névoa Dourada">
```

Para a imagem do hero, substitua a `<div class="hero__placeholder">` por:
```html
<img src="./assets/hero-tapecaria.jpg" alt="Tapeçaria Ateliê Jéssica Palomino">
```

### 4. Peças — adicionar ou remover cards

Cada card de produto é um `<article class="product-card">`. Para adicionar uma nova peça, copie um card existente e altere:
- Nome da peça
- Descrição e dimensões
- Preços (Pix e cartão)
- Nome da peça na URL do WhatsApp
- Imagem

### 5. Meta tags Open Graph (redes sociais)

Para que o link da página apareça com preview ao compartilhar, adicione dentro do `<head>`:

```html
<meta property="og:image" content="https://seusite.com/assets/hero-tapecaria.jpg">
<meta property="og:url" content="https://seusite.com">
```

---

## Publicar online (opções gratuitas)

| Plataforma      | Como                                                                 |
|-----------------|----------------------------------------------------------------------|
| **GitHub Pages** | Suba a pasta num repositório público → Settings → Pages → Deploy from branch |
| **Netlify**      | Arraste a pasta em [netlify.com/drop](https://app.netlify.com/drop) |
| **Vercel**       | `vercel deploy` na pasta, ou conecte o repositório GitHub            |

---

## Estrutura de arquivos

```
LANDING PAGE ATELIE/
├── index.html
├── README.md
└── assets/
    ├── hero-tapecaria.jpg        ← adicionar
    ├── jessica-palomino.jpg      ← adicionar
    ├── nevoa-dourada.jpg         ← adicionar
    ├── terra-viva.jpg            ← adicionar
    └── bruma-serena.jpg          ← adicionar
```
