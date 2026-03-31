import fs from 'fs';
import path from 'path';

const dirs = [
  'src/views/admin/brand',
  'src/views/admin/category',
  'src/views/admin/unit'
];

const templateReplacements = [
  { match: />\s*General Information\s*</g, replace: ">{{ $t('crud.generalInfo') }}<" },
  { match: />\s*System Information\s*</g, replace: ">{{ $t('crud.systemInfo') }}<" },
  { match: />\s*Created Date\s*</g, replace: ">{{ $t('fields.createdAt') }}<" },
  { match: />\s*Last Modified\s*</g, replace: ">{{ $t('fields.updatedAt') }}<" },
  { match: />\s*Status\s*</g, replace: ">{{ $t('fields.status') }}<" },
  { match: />\s*Name\s*</g, replace: ">{{ $t('fields.name') }}<" },
  { match: />\s*Code\s*</g, replace: ">{{ $t('fields.code') }}<" },
  { match: />\s*Slug\s*</g, replace: ">{{ $t('fields.slug') }}<" },
  { match: />\s*Description\s*</g, replace: ">{{ $t('fields.description') }}<" },
  { match: />\s*Symbol\s*</g, replace: ">{{ $t('fields.symbol') }}<" },
  { match: />\s*Conversion Factor\s*</g, replace: ">{{ $t('fields.conversionFactor') }}<" },
  { match: />\s*Default Price\s*</g, replace: ">{{ $t('fields.defaultPrice') }}<" },
  { match: />\s*Calculate Details\s*</g, replace: ">{{ $t('fields.isCalculateDetail') }}<" },
  { match: />\s*Actions\s*</g, replace: ">{{ $t('crud.actions') }}<" },
  { match: />\s*Image\s*</g, replace: ">{{ $t('crud.image') }}<" },
  { match: />\s*Active\s*</g, replace: ">{{ $t('crud.active') }}<" },
  { match: />\s*Inactive\s*</g, replace: ">{{ $t('crud.inactive') }}<" },
  { match: />\s*Cancel\s*</g, replace: ">{{ $t('crud.cancel') }}<" },
  { match: />\s*Delete\s*</g, replace: ">{{ $t('crud.delete') }}<" },
  { match: />\s*Edit\s*</g, replace: ">{{ $t('crud.editBtn') }}<" },
  { match: />\s*None\s*</g, replace: ">{{ $t('crud.none') }}<" },
  { match: />\s*All Status\s*</g, replace: ">{{ $t('crud.allStatus') }}<" },
  { match: />\s*Save Changes\s*</g, replace: ">{{ $t('crud.save') }}<" },
  { match: />\s*Create\s*</g, replace: ">{{ $t('crud.createBtn') }}<" },
  // Brand
  { match: />\s*Brands\s*</g, replace: ">{{ $t('modules.brands') }}<" },
  { match: />\s*Add Brand\s*</g, replace: ">{{ $t('crud.createBtn') }} {{ $t('modules.brand') }}<" },
  { match: />\s*Create Brand\s*</g, replace: ">{{ $t('crud.create', { module: $t('modules.brand') }) }}<" },
  { match: />\s*Edit Brand\s*</g, replace: ">{{ $t('crud.edit', { module: $t('modules.brand') }) }}<" },
  { match: />\s*Brand Image\s*</g, replace: ">{{ $t('modules.brand') }} {{ $t('crud.image') }}<" },
  { match: />\s*Brand Details\s*</g, replace: ">{{ $t('crud.detail', { module: $t('modules.brand') }) }}<" },
  { match: />\s*No brands found.\s*</g, replace: ">{{ $t('crud.noRecords', { module: $t('modules.brands') }) }}<" },
  { match: /placeholder="Search by name..."/g, replace: ':placeholder="$t(\'crud.search\', { module: $t(\'modules.brand\') })"' },

  // Category
  { match: />\s*Categories\s*</g, replace: ">{{ $t('modules.categories') }}<" },
  { match: />\s*Add Category\s*</g, replace: ">{{ $t('crud.createBtn') }} {{ $t('modules.category') }}<" },
  { match: />\s*Create Category\s*</g, replace: ">{{ $t('crud.create', { module: $t('modules.category') }) }}<" },
  { match: />\s*Edit Category\s*</g, replace: ">{{ $t('crud.edit', { module: $t('modules.category') }) }}<" },
  { match: />\s*Category Image\s*</g, replace: ">{{ $t('modules.category') }} {{ $t('crud.image') }}<" },
  { match: />\s*Category Details\s*</g, replace: ">{{ $t('crud.detail', { module: $t('modules.category') }) }}<" },
  { match: />\s*No categories found.\s*</g, replace: ">{{ $t('crud.noRecords', { module: $t('modules.categories') }) }}<" },
  
  // Unit
  { match: />\s*Units\s*</g, replace: ">{{ $t('modules.units') }}<" },
  { match: />\s*Add Unit\s*</g, replace: ">{{ $t('crud.createBtn') }} {{ $t('modules.unit') }}<" },
  { match: />\s*Create Unit\s*</g, replace: ">{{ $t('crud.create', { module: $t('modules.unit') }) }}<" },
  { match: />\s*Edit Unit\s*</g, replace: ">{{ $t('crud.edit', { module: $t('modules.unit') }) }}<" },
  { match: />\s*Unit Image\s*</g, replace: ">{{ $t('modules.unit') }} {{ $t('crud.image') }}<" },
  { match: />\s*Unit Details\s*</g, replace: ">{{ $t('crud.detail', { module: $t('modules.unit') }) }}<" },
  { match: />\s*No units found.\s*</g, replace: ">{{ $t('crud.noRecords', { module: $t('modules.units') }) }}<" },
  
  // Extra fields
  { match: />\s*Parent Brand\s*</g, replace: ">{{ $t('fields.parent') }} {{ $t('modules.brand') }}<" },
  { match: />\s*Parent Category\s*</g, replace: ">{{ $t('fields.parent') }} {{ $t('modules.category') }}<" },
  { match: />\s*Parent Unit\s*</g, replace: ">{{ $t('fields.parent') }} {{ $t('modules.unit') }}<" }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Basic template string replacements
  for (const { match, replace } of templateReplacements) {
    content = content.replace(match, replace);
  }

  // Inject useI18n if not present
  if (content.includes('vue-i18n') === false && content.includes('<script setup')) {
    content = content.replace(
      '<script setup lang="ts">',
      '<script setup lang="ts">\nimport { useI18n } from "vue-i18n";'
    );
    // Find the right place to put `const { t } = useI18n();`
    // After imports, before logic
    content = content.replace(
      /(import .*;\n)+/g,
      match => `${match}\nconst { t } = useI18n();\n`
    );
  }

  // Write changes
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Processed: ${filePath}`);
}

dirs.forEach(dir => {
  const fullDir = path.join(process.cwd(), dir);
  if (fs.existsSync(fullDir)) {
    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.vue'));
    files.forEach(f => processFile(path.join(fullDir, f)));
  }
});
