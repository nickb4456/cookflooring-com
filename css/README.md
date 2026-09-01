# Stylesheet workflow

`styles.css` is the readable source. The site serves `styles.min.css` to reduce render-blocking transfer without adding a required production build step.

After editing the source, regenerate the served file with clean-css-cli 5.6.3:

`cleancss -o css/styles.min.css css/styles.css`
