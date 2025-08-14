class MarkdownConverter {
    constructor() {
        this.markdownInput = document.getElementById('markdownInput');
        this.output = document.getElementById('output');
        this.preserveBreaksCheckbox = document.getElementById('preserveBreaks');
        this.enableFormattingCheckbox = document.getElementById('enableFormatting');
        
        this.initEventListeners();
        this.convert(); // Конвертируем начальный текст
    }
    
    initEventListeners() {
        this.markdownInput.addEventListener('input', () => this.convert());
        this.preserveBreaksCheckbox.addEventListener('change', () => this.convert());
        this.enableFormattingCheckbox.addEventListener('change', () => this.convert());
    }
    
    convert() {
        const markdown = this.markdownInput.value;
        const preserveBreaks = this.preserveBreaksCheckbox.checked;
        const enableFormatting = this.enableFormattingCheckbox.checked;
        
        let html = this.markdownToHtml(markdown, preserveBreaks, enableFormatting);
        
        this.output.innerHTML = html;
        this.output.classList.remove('fade-in');
        setTimeout(() => this.output.classList.add('fade-in'), 10);
    }
    
    markdownToHtml(markdown, preserveBreaks, enableFormatting) {
        let html = markdown;
        
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
        
        // Экранируем HTML теги
        html = html.replace(/</g, '<').replace(/>/g, '>');
        
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
            if (firstLi && /^\d+\./.test(this.markdownInput.value)) {
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