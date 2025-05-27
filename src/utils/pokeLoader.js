const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// fetch one Pokemon by ID
async function fetchPokemon(id) {
    const res = await fetch(`${POKEAPI_BASE}/pokemon/${id}`);
    if (!res.ok) throw new Error('PokeAPI error');
    const data = await res.json();
    return { id: data.id, name: data.name, image: data.sprites.front_default };
  }
  
  // get N unique random IDs
  function getRandomIds(count, max = 898) {
    const set = new Set();
    while (set.size < count) {
      set.add(Math.floor(Math.random() * max) + 1);
    }
    return Array.from(set);
  }
  
  // generate one quiz question
  async function generatePokemonQuestion() {
    // pick 4 distinct pokemon
    const ids = getRandomIds(4);
    const pokemons = await Promise.all(ids.map(fetchPokemon));
    // choose one as the correct answer
    const correctIndex = Math.floor(Math.random() * 4);
    return {
      id: pokemons[correctIndex].id,
      image: pokemons[correctIndex].image,
      options: pokemons.map(p => p.name),
      answerIndex: correctIndex,
    };
  }
  
  // generate N questions
  export async function loadPokemonQuestions(count = 10) {
    const questions = [];
    const seen = new Set();
    while (questions.length < count) {
      const q = await generatePokemonQuestion();
      if (!seen.has(q.id)) {
        seen.add(q.id);
        questions.push(q);
      }
    }
    return questions;
  }