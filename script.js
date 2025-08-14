class MarkdownConverter {
    constructor() {
        this.markdownInput = document.getElementById('markdownInput');
        this.output = document.getElementById('output');
        this.preserveBreaksCheckbox = document.getElementById('preserveBreaks');
        this.enableFormattingCheckbox = document.getElementById('enableFormatting');
        this.replaceNameCheckbox = document.getElementById('replaceName');
        
        this.initEventListeners();
        this.convert(); // Конвертируем начальный текст
    }

    initEventListeners() {
        this.markdownInput.addEventListener('input', () => this.convert());
        this.preserveBreaksCheckbox.addEventListener('change', () => this.convert());
        this.enableFormattingCheckbox.addEventListener('change', () => this.convert());
        this.replaceNameCheckbox.addEventListener('change', () => this.convert());

        // Новые кнопки
        this.copyMarkdownBtn = document.getElementById('copyMarkdownBtn');
        this.pasteMarkdownBtn = document.getElementById('pasteMarkdownBtn');
        this.clearInputBtn = document.getElementById('clearInputBtn');
        this.copyHtmlBtn = document.getElementById('copyHtmlBtn');
        this.downloadHtmlBtn = document.getElementById('downloadHtmlBtn');

        this.copyMarkdownBtn.addEventListener('click', () => this.copyMarkdown());
        this.pasteMarkdownBtn.addEventListener('click', () => this.pasteFromClipboard());
        this.clearInputBtn.addEventListener('click', () => this.clearInput());
        this.copyHtmlBtn.addEventListener('click', () => this.copyHtmlOutput());
        this.downloadHtmlBtn.addEventListener('click', () => this.downloadHtml());

        // Сочетания клавиш
        document.addEventListener('keydown', (event) => this.handleKeyboardShortcuts(event));
        // Add event listener to output div to make it focusable on click
        this.output.addEventListener('click', () => {
            this.output.focus();
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Анимация появления
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Анимация исчезновения и удаление
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('hide');
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }, 3000);
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Скопировано в буфер обмена!');
            return true;
        } catch (err) {
            console.error('Не удалось скопировать текст: ', err);
            // Fallback для старых браузеров или если Clipboard API недоступен
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed'; // Избегаем прокрутки
            textarea.style.left = '-9999px'; // Скрываем
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                this.showNotification('Скопировано в буфер обмена (fallback)!');
                return true;
            } catch (execErr) {
                console.error('Fallback копирование не удалось: ', execErr);
                this.showNotification('Не удалось скопировать текст.', 'error');
                return false;
            } finally {
                document.body.removeChild(textarea);
            }
        }
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            this.markdownInput.value = text;
            this.convert();
            this.showNotification('Текст вставлен из буфера обмена!');
            return true;
        } catch (err) {
            console.error('Не удалось вставить текст: ', err);
            this.showNotification('Не удалось вставить текст из буфера обмена. Возможно, нет разрешения.', 'error');
            return false;
        }
    }

    copyMarkdown() {
        this.copyToClipboard(this.markdownInput.value);
    }

    clearInput() {
        this.markdownInput.value = '';
        this.convert();
        this.showNotification('Поле ввода очищено!');
    }

    copyHtmlOutput() {
        this.copyToClipboard(this.output.innerHTML);
    }


    downloadHtml() {
        const fullHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Output</title>
    <link rel="stylesheet" href="style.css">
    <style>
        /* Встроенные стили для базового отображения, если style.css недоступен */
        body { font-family: sans-serif; line-height: 1.6; margin: 20px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        code { font-family: monospace; }
        blockquote { border-left: 4px solid #ccc; padding-left: 10px; color: #555; }
        /* Добавьте сюда другие важные стили из style.css, если нужно */
    </style>
</head>
<body>
    ${this.output.innerHTML}
</body>
</html>`;
        const blob = new Blob([fullHtml], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'markdown_output.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        this.showNotification('HTML файл скачан!');
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + V для вставки в Markdown
        if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
            if (document.activeElement === this.markdownInput) {
                // Если фокус в поле ввода, браузер сам вставит
                return;
            }
            event.preventDefault(); // Предотвращаем стандартное действие, если фокус не в поле ввода
            this.pasteFromClipboard();
        }

        // Ctrl/Cmd + C для копирования HTML-вывода (если фокус на output или нигде)
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            if (document.activeElement === this.output || document.activeElement === document.body) {
                event.preventDefault();
                this.copyHtmlOutput();
            }
        }

        // Ctrl/Cmd + A для выделения всего в output области
        if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
            if (document.activeElement === this.output) {
                event.preventDefault();
                // Выделяем весь контент в output области
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(this.output);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    convert() {
        let markdown = this.markdownInput.value;
        const preserveBreaks = this.preserveBreaksCheckbox.checked;
        const enableFormatting = this.enableFormattingCheckbox.checked;
        const replaceName = this.replaceNameCheckbox.checked;

        // Замена слова "имя" на {first_name}
        if (replaceName) {
            markdown = markdown.replace(/имя/gi, '{first_name}');
        }

        let html = this.markdownToHtml(markdown, preserveBreaks, enableFormatting);

        this.output.innerHTML = html;
        this.output.classList.remove('fade-in');
        setTimeout(() => this.output.classList.add('fade-in'), 10);
        this.attachCopyToCodeBlocks(); // Добавляем кнопки копирования к блокам кода
    }

    attachCopyToCodeBlocks() {
        const codeBlocks = this.output.querySelectorAll('pre code');
        codeBlocks.forEach(codeElement => {
            // Проверяем, есть ли уже кнопка копирования
            if (codeElement.previousElementSibling && codeElement.previousElementSibling.classList.contains('copy-code-button')) {
                return; // Кнопка уже есть, пропускаем
            }

            const preElement = codeElement.parentElement;
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-code-button';
            copyButton.textContent = 'Копировать';
            copyButton.setAttribute('aria-label', 'Копировать блок кода');

            copyButton.addEventListener('click', () => {
                const codeToCopy = codeElement.textContent;
                this.copyToClipboard(codeToCopy);
            });

            preElement.insertBefore(copyButton, codeElement);
        });
    }

    markdownToHtml(markdown, preserveBreaks, enableFormatting) {
        let html = markdown;

        // Экранируем HTML теги
        html = html.replace(/</g, '<').replace(/>/g, '>');

        if (!enableFormatting) {
            // Если форматирование отключено, только обрабатываем переносы строк
            if (preserveBreaks) {
                html = html.replace(/\n/g, '<br>');
            } else {
                html = html.replace(/\n\s*\n/g, '</p><p>');
                html = html.replace(/\n/g, ' ');
                html = `<p>${html}</p>`;
            }
            return html;
        }

        // Заголовки
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
        html = html.replace(/^##### (.*$)/gim, '<h5>$1</h5>');
        html = html.replace(/^###### (.*$)/gim, '<h6>$1</h6>');

        // Горизонтальные линии
        html = html.replace(/^---\s*$/gim, '<hr>');
        html = html.replace(/^\*\*\*\s*$/gim, '<hr>');

        // Блоки кода
        html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');

        // Цитаты
        html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

        // Списки
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

        // Оборачиваем списки в ul/ol теги
        html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
            // Проверяем, начинается ли список с цифры
            const firstLi = match.match(/<li>(.*?)<\/li>/);
            // Проверяем, является ли исходный markdown упорядоченным списком
            const isOrderedList = /^\d+\./m.test(markdown.split('\n').find(line => line.includes(firstLi[1])));

            if (firstLi && isOrderedList) {
                return `<ol>${match}</ol>`;
            }
            return `<ul>${match}</ul>`;
        });

        // Жирный текст
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

        // Курсивный текст
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.*?)_/g, '<em>$1</em>');

        // Код в строке
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Ссылки
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        // Обработка переносов строк
        if (preserveBreaks) {
            // Сохраняем все переносы строк как <br>
            html = html.replace(/\n/g, '<br>');
        } else {
            // Двойной перенос = новый абзац, одинарный = пробел
            html = html.replace(/\n\s*\n/g, '</p><p>');
            html = html.replace(/\n/g, ' ');
        }

        // Оборачиваем в параграфы, если не сохраняем переносы
        if (!preserveBreaks) {
            // Не оборачиваем в <p> если уже есть блочные элементы
            if (!/^<(h[1-6]|ul|ol|blockquote|pre|hr)/.test(html.trim())) {
                html = `<p>${html}</p>`;
            }
        }

        // Очистка пустых параграфов
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>\s*<\/p>/g, '');

        return html;
    }
}

// Инициализация конвертора
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownConverter();
});