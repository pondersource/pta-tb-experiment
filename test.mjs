import { parse } from 'pta-tools';
import { createReadStream } from 'fs';

async function run() {
  const filePath = './sample.journal';
  const readableStream = createReadStream(filePath);
  const parseResult = await parse(readableStream);
  console.log(parseResult);
}

// ...
run();