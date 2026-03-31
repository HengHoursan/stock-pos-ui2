import fs from 'fs';
import path from 'path';

const dirs = [
  'src/views/admin/brand',
  'src/views/admin/category',
  'src/views/admin/unit'
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Clean up previous messy injections
  content = content.replace(/import \{ useI18n \} from "vue-i18n";\r?\n?/g, '');
  content = content.replace(/const \{ t \} = useI18n\(\);\r?\n?/g, '');
  
  // Inject cleanly exactly once under script
  content = content.replace(/<script setup lang="ts">\r?\n?/, `<script setup lang="ts">\nimport { useI18n } from "vue-i18n";\nconst { t } = useI18n();\n`);
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Fixed: ${filePath}`);
}

dirs.forEach(dir => {
  const fullDir = path.join(process.cwd(), dir);
  if (fs.existsSync(fullDir)) {
    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.vue'));
    files.forEach(f => processFile(path.join(fullDir, f)));
  }
});
