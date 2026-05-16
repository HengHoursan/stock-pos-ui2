import { createApp } from 'vue';
import router from './router';
import i18n from './i18n';

import './style.css';
import 'vue-sonner/style.css';

import App from './App.vue';

import { permission } from './directives/permission';

import pinia from './stores';
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(i18n);
app.directive('permission', permission);

app.mount('#app');
