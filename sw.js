self.addEventListener('install', e => {
    console.log('التطبيق مثبت');
});
self.addEventListener('fetch', e => {
    console.log('يعمل بدون إنترنت');
});
