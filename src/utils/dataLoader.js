export async function loadBigOQuestions() {
    const resp = await fetch('/Trivio/data/bigO.json');
    return await resp.json();
  }