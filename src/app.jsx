import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// BANNERS DO CARROSSEL
const BANNERS_DATA = [
  {
    id: 'b1',
    tag: '⭐ Destaque da Semana',
    title: 'Panquecas Fluffy com Calda',
    sub: 'O segredo da Lili para a massa ficar incrivelmente fofinha e leve!',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'b2',
    tag: '🥑 Leve & Saudável',
    title: 'Guacamole Fresco com Nachos',
    sub: 'Perfeito para o final de semana com a família. Pronto em 15min!',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
  }
];

// RECEITAS PADRÃO (FALLBACK)
const DEFAULT_RECIPES = [
  {
    id: '1',
    title: 'Panquecas Fluffy de Morango',
    author: 'Lili',
    time: '20 min',
    difficulty: 'Fácil',
    category: 'Sobremesa',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    servings: 4,
    ingredients: ['1 xícara de farinha de trigo', '1 colher de sopa de açúcar', '1 ovo', '200ml de leite', 'Morangos frescos'],
    instructions: ['Misture os ingredientes secos numa tigela.', 'Adicione o ovo e o leite, misturando suavemente.', 'Aqueça uma frigideira e doure ambos os lados.'],
    feedbacks: []
  }
];

export default function App() {
  const [recipes, setRecipes] = useState(DEFAULT_RECIPES);
  const [loading, setLoading] = useState(true);
  const [supabaseError, setSupabaseError] = useState(null);
  
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('lilis_favs')) || []);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentScreen, setCurrentScreen] = useState('screenHome');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [servingsScale, setServingsScale] = useState(1);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Formulário de Nova Receita
  const [newRecipe, setNewRecipe] = useState({
    title: '', time: '', difficulty: 'Fácil', servings: 4, category: 'Sobremesa', image: '', ingredients: '', instructions: ''
  });

  const [feedbackComment, setFeedbackComment] = useState('');

  // Busca dados do Supabase
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setSupabaseError(null);

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted = data.map(r => ({
          ...r,
          ingredients: Array.isArray(r.ingredients) ? r.ingredients : (typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : []),
          instructions: Array.isArray(r.instructions) ? r.instructions : (typeof r.instructions === 'string' ? JSON.parse(r.instructions) : []),
          feedbacks: []
        }));
        setRecipes(formatted);
      }
    } catch (err) {
      console.warn('Supabase Error:', err.message);
      setSupabaseError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carrega comentários
  const fetchComentarios = async (recipeId) => {
    try {
      const { data, error } = await supabase
        .from('comentarios')
        .select('*')
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSelectedRecipe(prev => prev ? ({ ...prev, feedbacks: data || [] }) : null);
    } catch (err) {
      console.error('Erro nos comentários:', err.message);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    localStorage.setItem('lilis_favs', JSON.stringify(favorites));
  }, [favorites]);

  // Alterna banners
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % BANNERS_DATA.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe);
    setServingsScale(1);
    setCurrentScreen('screenDetails');
    fetchComentarios(recipe.id);
  };

  const toggleFavorite = (id, e) => {
    if (e) e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  // 🛠️ CADASTRO CORRIGIDO NO SUPABASE
  const handleCreateRecipe = async (e) => {
    e.preventDefault();

    const ingredientsArray = newRecipe.ingredients.split('\n').map(i => i.trim()).filter(Boolean);
    const instructionsArray = newRecipe.instructions.split('\n').map(i => i.trim()).filter(Boolean);

    const recipeToInsert = {
      title: newRecipe.title.trim(),
      author: 'Lili',
      time: newRecipe.time.trim(),
      difficulty: newRecipe.difficulty,
      category: newRecipe.category,
      servings: parseInt(newRecipe.servings) || 4,
      image: newRecipe.image.trim() || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80',
      ingredients: ingredientsArray,
      instructions: instructionsArray
    };

    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeToInsert])
        .select();

      if (error) throw error;

      alert('Receita cadastrada com sucesso no Supabase!');
      setNewRecipe({ title: '', time: '', difficulty: 'Fácil', servings: 4, category: 'Sobremesa', image: '', ingredients: '', instructions: '' });
      await fetchRecipes();
      setCurrentScreen('screenHome');
    } catch (err) {
      console.error('Erro ao salvar receita:', err.message);
      alert('Erro ao guardar receita no banco de dados: ' + err.message);
    }
  };

  // Enviar comentário
  const handleAddFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackComment.trim() || !selectedRecipe) return;

    const novoComentario = {
      recipe_id: selectedRecipe.id,
      usuario: 'Você',
      texto: feedbackComment.trim()
    };

    try {
      const { data, error } = await supabase
        .from('comentarios')
        .insert([novoComentario])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setSelectedRecipe(prev => ({
          ...prev,
          feedbacks: [data[0], ...(prev.feedbacks || [])]
        }));
      }
      setFeedbackComment('');
    } catch (err) {
      console.error('Erro ao guardar comentário:', err.message);
      const comentarioLocal = { id: Date.now(), usuario: 'Você', texto: feedbackComment.trim() };
      setSelectedRecipe(prev => ({ ...prev, feedbacks: [comentarioLocal, ...(prev.feedbacks || [])] }));
      setFeedbackComment('');
    }
  };

  // 🛠️ MULTIPLICADOR INTELIGENTE DE INGREDIENTES
  const scaleIngredient = (text, scale) => {
    if (scale === 1) return text;
    
    return text.replace(/(\d+([\.,]\d+)?)/g, (match) => {
      const num = parseFloat(match.replace(',', '.'));
      if (isNaN(num)) return match;
      const result = num * scale;
      // Formata números sem casas decimais desnecessárias
      return Number.isInteger(result) ? result : result.toFixed(1).replace('.', ',');
    });
  };

  const filteredRecipes = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.ingredients && r.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase())));

    if (currentFilter === 'fav') return matchesSearch && favorites.includes(r.id);
    if (currentFilter === 'user') return matchesSearch && (r.author === 'Você' || r.author === 'Lili');
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-amber-50/30 font-sans text-slate-800 pb-12">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button onClick={() => setCurrentScreen('screenHome')} className="flex items-center gap-2 font-black text-xl text-orange-600">
            <i className="fa-solid fa-utensils"></i>
            <span>Lili's Recipes</span>
          </button>
          
          <button 
            onClick={() => setCurrentScreen('screenNewRecipe')} 
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-md hover:opacity-90 transition active:scale-95 flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i>
            <span>Nova Receita</span>
          </button>
        </div>
      </header>

      {/* HOME */}
      {currentScreen === 'screenHome' && (
        <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
          
          {/* BANNERS */}
          {currentFilter === 'all' && (
            <div className="relative h-60 sm:h-72 w-full rounded-3xl overflow-hidden shadow-lg bg-slate-900 border border-orange-100">
              {BANNERS_DATA.map((b, idx) => (
                <div 
                  key={b.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${idx === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img src={b.image} className="w-full h-full object-cover" alt={b.title} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white max-w-xl">
                    <span className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-xl uppercase tracking-wider mb-2 inline-block">
                      {b.tag}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black">{b.title}</h2>
                    <p className="text-xs sm:text-sm text-orange-100">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* BARRA DE PESQUISA */}
          <div className="relative">
            <input 
              type="text"
              placeholder="Pesquisar receitas da Lili, ingredientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 pl-11 bg-white border border-orange-100 rounded-2xl text-sm focus:outline-none focus:border-orange-500 shadow-sm"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-4.5 text-slate-400"></i>
          </div>

          {/* FILTROS */}
          <div className="flex border-b border-orange-200/60 font-bold text-sm">
            <button 
              onClick={() => setCurrentFilter('all')}
              className={`pb-3 px-4 ${currentFilter === 'all' ? 'border-b-2 border-orange-500 text-orange-600 font-extrabold' : 'text-slate-500'}`}
            >
              Explorar
            </button>
            <button 
              onClick={() => setCurrentFilter('fav')}
              className={`pb-3 px-4 ${currentFilter === 'fav' ? 'border-b-2 border-orange-500 text-orange-600 font-extrabold' : 'text-slate-500'}`}
            >
              Favoritas ({favorites.length})
            </button>
            <button 
              onClick={() => setCurrentFilter('user')}
              className={`pb-3 px-4 ${currentFilter === 'user' ? 'border-b-2 border-orange-500 text-orange-600 font-extrabold' : 'text-slate-500'}`}
            >
              Minhas Receitas
            </button>
          </div>

          {supabaseError && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl text-xs flex items-center justify-between">
              <span>⚠️ Exibindo receitas em modo offline. ({supabaseError})</span>
              <button onClick={fetchRecipes} className="underline font-bold ml-2">Tentar de novo</button>
            </div>
          )}

          {/* LISTA DE RECEITAS */}
          <h2 className="text-lg font-black text-slate-900">
            {currentFilter === 'all' ? 'Todas as Receitas' : currentFilter === 'fav' ? 'Suas Receitas Favoritas' : 'Receitas Criadas por Você'}
          </h2>

          {loading ? (
            <div className="text-center py-12 text-slate-400 font-bold text-sm">A carregar receitas...</div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-orange-100 p-8">
              <i className="fa-solid fa-cookie-bite text-4xl text-orange-300 mb-3 block"></i>
              <p className="font-extrabold text-slate-700">Nenhuma receita encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe) => {
                const isFav = favorites.includes(recipe.id);
                return (
                  <div 
                    key={recipe.id}
                    onClick={() => handleSelectRecipe(recipe)}
                    className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-xl hover:-translate-y-1 transition duration-300 group"
                  >
                    <div className="relative h-48 bg-orange-50">
                      <img src={recipe.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={recipe.title} />
                      <button 
                        onClick={(e) => toggleFavorite(recipe.id, e)}
                        className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md ${isFav ? 'text-rose-500' : 'text-slate-400'}`}
                      >
                        <i className={`fa-${isFav ? 'solid' : 'regular'} fa-heart text-sm`}></i>
                      </button>
                      <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-xl">
                        {recipe.category || 'Receita'}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm line-clamp-1 mb-1">{recipe.title}</h3>
                        <p className="text-[11px] text-orange-600 font-extrabold mb-3">Por {recipe.author || 'Lili'}</p>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 pt-2.5 border-t border-orange-50 font-bold">
                        <span className="flex items-center gap-1"><i className="fa-regular fa-clock text-orange-500"></i> {recipe.time}</span>
                        <span className="flex items-center gap-1"><i className="fa-solid fa-fire text-rose-500"></i> {recipe.difficulty}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* DETALHES DA RECEITA */}
      {currentScreen === 'screenDetails' && selectedRecipe && (
        <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
          <button onClick={() => setCurrentScreen('screenHome')} className="text-xs font-extrabold text-orange-600 bg-orange-100/50 hover:bg-orange-100 px-4 py-2.5 rounded-2xl flex items-center gap-2 transition">
            <i className="fa-solid fa-arrow-left"></i> Voltar para receitas
          </button>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-5 space-y-4">
              <div className="relative h-72 rounded-3xl overflow-hidden shadow-lg bg-orange-100">
                <img src={selectedRecipe.image} className="w-full h-full object-cover" alt={selectedRecipe.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h1 className="text-2xl font-black">{selectedRecipe.title}</h1>
                  <p className="text-xs text-orange-200">Por {selectedRecipe.author}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-orange-100 p-3 rounded-2xl text-center shadow-sm">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Tempo</p>
                  <p className="text-xs font-black text-slate-800">{selectedRecipe.time}</p>
                </div>
                <div className="bg-white border border-orange-100 p-3 rounded-2xl text-center shadow-sm">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Nível</p>
                  <p className="text-xs font-black text-slate-800">{selectedRecipe.difficulty}</p>
                </div>
                <div className="bg-white border border-orange-100 p-3 rounded-2xl text-center shadow-sm">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Porções</p>
                  <p className="text-xs font-black text-slate-800">{Math.round((selectedRecipe.servings || 4) * servingsScale)}</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-6">
              {/* INGREDIENTES COM MULTIPLICADOR REAL */}
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-orange-100">
                  <h3 className="font-extrabold text-base flex items-center gap-2"><i className="fa-solid fa-basket-shopping text-orange-500"></i> Ingredientes</h3>
                  <div className="flex items-center gap-2 bg-orange-50 p-1 rounded-xl text-xs font-bold">
                    <button onClick={() => setServingsScale(s => Math.max(0.5, s - 0.5))} className="w-7 h-7 bg-white hover:bg-orange-100 rounded-lg shadow-sm font-black text-orange-600 transition">-</button>
                    <span className="px-2 text-orange-800">{servingsScale}x</span>
                    <button onClick={() => setServingsScale(s => s + 0.5)} className="w-7 h-7 bg-white hover:bg-orange-100 rounded-lg shadow-sm font-black text-orange-600 transition">+</button>
                  </div>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm">
                  {selectedRecipe.ingredients && selectedRecipe.ingredients.map((ing, idx) => (
                    <li key={idx} className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100/50 flex items-center gap-3">
                      <input type="checkbox" className="accent-orange-500 w-4 h-4 cursor-pointer" />
                      <span>{scaleIngredient(ing, servingsScale)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* MODO DE PREPARO */}
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
                <h3 className="font-extrabold text-base mb-4 pb-2 border-b border-orange-100 flex items-center gap-2"><i className="fa-solid fa-list-check text-rose-500"></i> Modo de Preparo</h3>
                <ol className="space-y-3 text-xs sm:text-sm">
                  {selectedRecipe.instructions && selectedRecipe.instructions.map((step, idx) => (
                    <li key={idx} className="flex gap-3 bg-orange-50/40 p-3.5 rounded-2xl border border-orange-100/60">
                      <span className="w-6 h-6 bg-gradient-to-tr from-orange-500 to-rose-500 text-white font-extrabold rounded-lg flex items-center justify-center text-xs flex-shrink-0">{idx + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* COMENTÁRIOS */}
              <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
                <h3 className="font-extrabold text-base mb-4 flex items-center gap-2"><i className="fa-solid fa-comments text-amber-500"></i> Comentários</h3>
                
                <form onSubmit={handleAddFeedback} className="space-y-3 mb-4">
                  <textarea 
                    rows={2} 
                    placeholder="O que achou dessa receita?"
                    value={feedbackComment}
                    onChange={e => setFeedbackComment(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-orange-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
                  />
                  <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md">Comentar</button>
                </form>

                <div className="space-y-2">
                  {selectedRecipe.feedbacks && selectedRecipe.feedbacks.length > 0 ? (
                    selectedRecipe.feedbacks.map((fb, idx) => (
                      <div key={fb.id || idx} className="bg-orange-50/30 p-3 rounded-2xl border border-orange-100/60 text-xs">
                        <p className="font-extrabold text-slate-800">{fb.usuario || fb.user || 'Anónimo'}</p>
                        <p className="text-slate-600">{fb.texto || fb.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Seja o primeiro a comentar nesta receita!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* CADASTRAR NOVA RECEITA */}
      {currentScreen === 'screenNewRecipe' && (
        <main className="max-w-2xl mx-auto px-4 pt-6">
          <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm space-y-4">
            <h2 className="text-xl font-black text-slate-900">Nova Receita</h2>
            <form onSubmit={handleCreateRecipe} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-extrabold block mb-1">Título</label>
                <input required type="text" value={newRecipe.title} onChange={e => setNewRecipe({...newRecipe, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-orange-100 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold block mb-1">Tempo</label>
                  <input required type="text" placeholder="ex: 30 min" value={newRecipe.time} onChange={e => setNewRecipe({...newRecipe, time: e.target.value})} className="w-full p-3 bg-slate-50 border border-orange-100 rounded-xl" />
                </div>
                <div>
                  <label className="font-extrabold block mb-1">Dificuldade</label>
                  <select value={newRecipe.difficulty} onChange={e => setNewRecipe({...newRecipe, difficulty: e.target.value})} className="w-full p-3 bg-slate-50 border border-orange-100 rounded-xl">
                    <option>Fácil</option>
                    <option>Médio</option>
                    <option>Difícil</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-extrabold block mb-1">URL da Imagem</label>
                <input type="text" placeholder="https://..." value={newRecipe.image} onChange={e => setNewRecipe({...newRecipe, image: e.target.value})} className="w-full p-3 bg-slate-50 border border-orange-100 rounded-xl" />
              </div>
              <div>
                <label className="font-extrabold block mb-1">Ingredientes (um por linha)</label>
                <textarea required rows={3} value={newRecipe.ingredients} onChange={e => setNewRecipe({...newRecipe, ingredients: e.target.value})} className="w-full p-3 bg-slate-50 border border-orange-100 rounded-xl" placeholder="1 peito de frango&#10;1 lata de milho" />
              </div>
              <div>
                <label className="font-extrabold block mb-1">Modo de Preparo (um por linha)</label>
                <textarea required rows={3} value={newRecipe.instructions} onChange={e => setNewRecipe({...newRecipe, instructions: e.target.value})} className="w-full p-3 bg-slate-50 border border-orange-100 rounded-xl" placeholder="Refogue o alho...&#10;Adicione o milho..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCurrentScreen('screenHome')} className="flex-1 py-3 bg-slate-100 font-extrabold rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-extrabold rounded-xl shadow-md">Salvar Receita</button>
              </div>
            </form>
          </div>
        </main>
      )}
    </div>
  );
}