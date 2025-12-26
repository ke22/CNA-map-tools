// Debug script for button click issue
// Run this in browser console

console.log('🔍 Starting button click diagnostic...\n');

// Check if buttons exist
const buttons = document.querySelectorAll('.btn-toggle[data-type]');
console.log(`📊 Found ${buttons.length} buttons with data-type:`);
buttons.forEach((btn, i) => {
    console.log(`  ${i + 1}. data-type="${btn.dataset.type}", text="${btn.textContent.trim()}"`);
});

// Check button properties
const adminButton = document.querySelector('.btn-toggle[data-type="administration"]');
if (adminButton) {
    console.log('\n✅ "行政區" button found!');
    console.log('Button details:', {
        disabled: adminButton.disabled,
        style: {
            pointerEvents: window.getComputedStyle(adminButton).pointerEvents,
            zIndex: window.getComputedStyle(adminButton).zIndex,
            position: window.getComputedStyle(adminButton).position,
            display: window.getComputedStyle(adminButton).display,
            visibility: window.getComputedStyle(adminButton).visibility,
            opacity: window.getComputedStyle(adminButton).opacity
        },
        classList: Array.from(adminButton.classList),
        offsetWidth: adminButton.offsetWidth,
        offsetHeight: adminButton.offsetHeight
    });
    
    // Try direct click
    console.log('\n🖱️ Testing direct click...');
    adminButton.addEventListener('click', function(e) {
        console.log('✅ Direct click event fired!', e);
        console.log('Button data-type:', this.dataset.type);
    });
    
    // Check if element is visible
    const rect = adminButton.getBoundingClientRect();
    console.log('\n📐 Button position:', {
        visible: rect.width > 0 && rect.height > 0,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
    });
    
    // Check for overlapping elements
    const elementAtPoint = document.elementFromPoint(rect.x + rect.width/2, rect.y + rect.height/2);
    console.log('\n🎯 Element at button center:', {
        tagName: elementAtPoint?.tagName,
        id: elementAtPoint?.id,
        className: elementAtPoint?.className,
        isButton: elementAtPoint === adminButton,
        isButtonParent: adminButton.contains(elementAtPoint)
    });
    
    if (elementAtPoint !== adminButton && !adminButton.contains(elementAtPoint)) {
        console.warn('⚠️ Something is blocking the button!');
        console.log('Blocking element:', elementAtPoint);
    }
    
} else {
    console.error('❌ "行政區" button NOT found!');
    console.log('Available buttons:', Array.from(buttons).map(b => b.dataset.type));
}

// Check event listeners
console.log('\n📡 Checking event listeners...');
const adminBtn = document.querySelector('.btn-toggle[data-type="administration"]');
if (adminBtn) {
    // Get all event listeners (if available)
    console.log('Button element:', adminBtn);
    console.log('Try clicking the button now and check if this script detects it.');
}

// Manual test
console.log('\n🧪 Manual test:');
console.log('Run this to test click:');
console.log('document.querySelector(\'.btn-toggle[data-type="administration"]\').click();');


