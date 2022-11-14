import path from 'path';
import fs from 'fs-extra';
import sharpsheet from 'sharpsheet';

async function build(config = {}) {
  const items = config.items || 10;
  const name = config.name || 'sprite';
  const cssFileName = name + '.css';

  async function generateImages() {
    console.log(`${config.input} -> ${config.output}`);

    const border = config.border || 1;
    const width = config.width || 100;
    const jsonFileName = name + '.json';

    const options = {
      border,
      sheetDimension: (width + 2 * border) * items,
      outputFormat: 'webp',
      outputQuality: 95,
      outputFilename: jsonFileName,
    };

    await fs.emptyDir(config.output);

    console.log('\tgenerating images');

    await sharpsheet(config.input, config.output, options);

    return await fs.readJSON(path.join(config.output, jsonFileName));
  }

  async function generateCss(json) {
    console.log('\tgenerating css');

    const spriteFilePrefix = name + '-';

    const classNames = [];
    const css = [];

    css.push(`[class^="${name}-"] {`);
    css.push('  background-repeat: no-repeat;');
    css.push(`  background-size: ${items * 100}%;`);
    css.push('}');

    let spriteIndex = -1;

    for (const spritesheet of json.spritesheets) {
      spriteIndex++;

      const image = `${spriteFilePrefix}${spriteIndex}.webp`;

      await fs.move(
        path.join(config.output, spritesheet.image),
        path.join(config.output, image)
      );

      let col = -1;
      let row = 0;

      for (const sprite of spritesheet.sprites) {
        col++;

        if (col >= items) {
          col = 0;
          row++;
        }

        const x = (100 / (items - 1)) * col;
        const y = (100 / (items - 1)) * row;

        const className = `${name}-${sprite.name}`;
        classNames.push(className);

        css.push(`.${className} {`);
        css.push(`  background-image: url(${image});`);
        css.push(`  background-position: ${x}% ${y}%;`);
        css.push('}');
      }
    }

    await fs.writeFile(path.join(config.output, cssFileName), css.join('\n'));

    return classNames;
  }

  async function generateHtml(classNames) {
    console.log('\tgenerating html preview');

    const html = [];

    const size = 125;

    html.push('<!DOCTYPE html>');
    html.push('<html lang="en">');
    html.push('<head>');
    html.push('  <meta charset="UTF-8">');
    html.push(
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
    );
    html.push('  <title>Spritesheet Preview</title>');
    html.push(`  <link rel="stylesheet" href="${cssFileName}">`);
    html.push('  <style>');
    html.push('    div {');
    html.push('      border: 1px solid red;');
    html.push(`      width: ${size}px;`);
    html.push(`      height: ${size}px;`);
    html.push('      display: inline-block;');
    html.push('    }');
    html.push('  </style>');
    html.push('</head>');
    html.push('<body>');

    for (const className of classNames) {
      html.push(`  <div class="${className}"></div>`);
    }

    html.push('</body>');
    html.push('</html>');

    const htmlFileName = name + '.html';

    await fs.writeFile(path.join(config.output, htmlFileName), html.join('\n'));

    console.log('');
  }

  const json = await generateImages();
  const classNames = await generateCss(json);
  await generateHtml(classNames);
}

await build({
  input: 'pokemon/webp-small/*.webp',
  output: 'pokemon/webp-small-spritesheet',
  name: 'sprite-pokemon',
  border: 1,
  items: 10,
  width: 250,
});

await build({
  input: 'pokemon-home/webp-small/regular/*.webp',
  output: 'pokemon-home/webp-small-regular-spritesheet',
  name: 'sprite-pokemon',
  border: 1,
  items: 10,
  width: 250,
});

await build({
  input: 'pokemon-sprite-gen9/webp/regular/*.webp',
  output: 'pokemon-sprite-gen9/webp-regular-spritesheet',
  name: 'sprite-pokemon',
  border: 1,
  items: 10,
  width: 256,
});
