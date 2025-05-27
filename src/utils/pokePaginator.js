import { generatePokemonQuestion } from "./pokeLoader";

export function createPokePaginator(total = 10, chunkSize = 3) {
  let fetchedCount = 0;
  let buffer = [];
  const seenIds = new Set();

  // fetch one “chunk” of unique questions
  async function nextChunk() {
    const chunk = [];
    while (chunk.length < Math.min(chunkSize, total - fetchedCount)) {
      const q = await generatePokemonQuestion();
      if (!seenIds.has(q.id)) {
        seenIds.add(q.id);
        chunk.push(q);
      }
    }
    buffer = buffer.concat(chunk);
    fetchedCount += chunk.length;
  }

  return {
    // initial fetch of first chunk
    async init() {
      await nextChunk();
    },
    // ensure that when user is at index `i`, if we’re within 2 of buffer end, we fire off another chunk
    async ensureBuffer(currentIndex) {
      if (buffer.length - currentIndex <= 2 && fetchedCount < total) {
        nextChunk().catch(console.error);
      }
    },
    get buffer() {
      return buffer;
    },
    get isDone() {
      return fetchedCount >= total;
    },
  };
}
