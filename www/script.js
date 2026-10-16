import { supabase } from './supabaseClient.js';

// BANNERS DO CARROSSEL TIPO iFOOD
const bannersData = [
  {
    tag: '⭐ Destaque da Semana',
    title: 'Panquecas Fluffy com Calda',
    sub: 'O segredo da Lili para a massa ficar incrivelmente fofinha e leve!',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1200&q=80',
    recipeId: '1'
  },
  {
    tag: '🥑 Leve & Saudável',
    title: 'Guacamole Fresco com Nachos',
    sub: 'Perfeito para o final de semana com a família. Pronto em 15min!',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    recipeId: '2'
  },
  {
    tag: '🧁 Especial Doces',
    title: 'Segredos da Confeitaria Caseira',
    sub: 'Aprenda a fazer sobremesas irresistíveis com o carinho da Lili.',
    image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=1200&q=80',
    recipeId: null
  }
];

// Estado Global
let recipes = [];
let favorites = JSON.parse(localStorage.getItem('lilis_favs')) || [];
let currentFilter = 'all';
let activeRecipeId = null;
let currentServingsScale = 1;

// Estado do Carrossel
let currentBannerIndex = 0;
let bannerInterval = null;

// Salvar Estado dos Favoritos
function saveState() {
  localStorage.setItem('lilis_favs', JSON.stringify(favorites));
}

// ================= SUPABASE INTEGRATION (READ) =================
async function fetchRecipes() {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    recipes = data.map(r => ({
      ...r,
      ingredients: typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : (r.ingredients || []),
      instructions: typeof r.instructions === 'string' ? JSON.parse(r.instructions) : (r.instructions || []),
      feedbacks: typeof r.feedbacks === 'string' ? JSON.parse(r.feedbacks) : (r.feedbacks || [])
    }));

    renderRecipes();
  } catch (error) {
    console.error('Erro ao buscar receitas no Supabase:', error.message);
  }
}

// NAVEGAÇÃO DE TELAS
function navigateTo(screenId) {
  document.getElementById('screenHome').classList.add('hidden');
  document.getElementById('screenDetails').classList.add('hidden');
  document.getElementById('screenNewRecipe').classList.add('hidden');

  document.getElementById(screenId).classList.remove('hidden');
  window.scrollTo(0, 0);
}

// LÓGICA DO CARROSSEL DE BANNERS
function renderBanners() {
  const container = document.getElementById('bannerContainer');
  const dotsContainer = document.getElementById('bannerDots');
  if (!container || !dotsContainer) return;

  container.innerHTML = bannersData.map((b, idx) => `
    <div class="absolute inset-0 transition-opacity duration-700 ease-in-out ${idx === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}" ${b.recipeId ? `onclick="openRecipeDetails('${b.recipeId}')"` : ''}>
      <img src="${b.image}" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent"></div>
      <div class="absolute bottom-6 left-6 right-6 text-white max-w-xl">
        <span class="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[11px] font-black px-3 py-1 rounded-xl uppercase tracking-wider mb-2 inline-block shadow-sm">
          ${b.tag}
        </span>
        <h2 class="text-xl sm:text-2xl md:text-3xl font-black leading-tight mb-1 text-amber-50 drop-shadow-sm">${b.title}</h2>
        <p class="text-xs sm:text-sm text-orange-100/90 line-clamp-2 font-medium">${b.sub}</p>
      </div>
    </div>
  `).join('');

  dotsContainer.innerHTML = bannersData.map((_, idx) => `
    <button onclick="goToBanner(${idx})" class="h-2 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'w-6 bg-orange-500' : 'w-2 bg-white/60 hover:bg-white'}"></button>
  `).join('');
}

function nextBanner() {
  currentBannerIndex = (currentBannerIndex + 1) % bannersData.length;
  renderBanners();
}

function prevBanner() {
  currentBannerIndex = (currentBannerIndex - 1 + bannersData.length) % bannersData.length;
  renderBanners();
}

function goToBanner(index) {
  currentBannerIndex = index;
  renderBanners();
}

function startBannerTimer() {
  if (bannerInterval) clearInterval(bannerInterval);
  bannerInterval = setInterval(nextBanner, 4000);
}

// FILTROS
function setFilter(filter) {
  currentFilter = filter;
  const tabAll = document.getElementById('tabAll');
  const tabFav = document.getElementById('tabFav');
  const tabUser = document.getElementById('tabUser');
  const bannerSection = document.getElementById('bannerCarouselSection');
  const createBanner = document.getElementById('createRecipeBanner');
  const sectionTitle = document.getElementById('sectionTitle');

  const activeClass = 'flex-1 md:flex-none px-5 py-2.5 text-orange-600 border-b-2 border-orange-500 transition font-extrabold';
  const inactiveClass = 'flex-1 md:flex-none px-5 py-2.5 text-slate-400 border-b-2 border-transparent hover:text-slate-600 transition font-bold';

  if (tabAll) tabAll.className = filter === 'all' ? activeClass : inactiveClass;
  if (tabFav) tabFav.className = filter === 'fav' ? activeClass : inactiveClass;
  if (tabUser) tabUser.className = filter === 'user' ? activeClass : inactiveClass;

  if (filter === 'all') {
    if (bannerSection) bannerSection.classList.remove('hidden');
    if (createBanner) createBanner.classList.add('hidden');
    if (sectionTitle) sectionTitle.textContent = 'Todas as Receitas';
  } else if (filter === 'user') {
    if (bannerSection) bannerSection.classList.add('hidden');
    if (createBanner) createBanner.classList.remove('hidden');
    if (sectionTitle) sectionTitle.textContent = 'Minhas Receitas Cadastradas';
  } else {
    if (bannerSection) bannerSection.classList.add('hidden');
    if (createBanner) createBanner.classList.add('hidden');
    if (sectionTitle) sectionTitle.textContent = 'Minhas Receitas Favoritas';
  }

  navigateTo('screenHome');
  renderRecipes();
}

// FAVORITOS
function toggleFavorite(id, event) {
  if (event) event.stopPropagation();
  
  if (favorites.includes(id)) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }
  saveState();
  renderRecipes();

  if (activeRecipeId === id) {
    const detailBtn = document.getElementById('detailFavBtn');
    if (detailBtn) {
      const isFav = favorites.includes(id);
      detailBtn.className = `w-11 h-11 rounded-2xl border flex items-center justify-center transition shadow-sm ${isFav ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-orange-100 text-slate-400'}`;
      detailBtn.innerHTML = `<i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>`;
    }
  }
}

// RENDERIZAR LISTA DE RECEITAS
function renderRecipes() {
  const searchInput = document.getElementById('searchInput');
  const search = searchInput ? searchInput.value.toLowerCase() : '';
  const grid = document.getElementById('recipeGrid');
  const emptyState = document.getElementById('emptyState');
  const favCount = document.getElementById('favCount');
  
  if (favCount) favCount.textContent = favorites.length;
  if (!grid) return;

  const filtered = recipes.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search) ||
      (r.ingredients && r.ingredients.some(ing => ing.toLowerCase().includes(search))) ||
      (r.author && r.author.toLowerCase().includes(search));
    
    if (currentFilter === 'fav') return matchesSearch && favorites.includes(r.id);
    if (currentFilter === 'user') return matchesSearch && (r.isUserCreated || r.author === 'Você' || r.author === 'Usuário App Mobile');
    return matchesSearch;
  });

  grid.innerHTML = '';

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    filtered.forEach(recipe => {
      const isFav = favorites.includes(recipe.id);
      const card = document.createElement('div');
      card.className = 'bg-white rounded-3xl border border-orange-100/80 shadow-sm overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition group hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200';
      card.onclick = () => openRecipeDetails(recipe.id);

      card.innerHTML = `
        <div class="relative h-52 w-full overflow-hidden bg-orange-50">
          <img src="${recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'}" alt="${recipe.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          <button 
            onclick="toggleFavorite('${recipe.id}', event)" 
            class="absolute top-3.5 right-3.5 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md ${isFav ? 'text-rose-500' : 'text-slate-400'} hover:scale-110 transition"
          >
            <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart text-base"></i>
          </button>
          <span class="absolute bottom-3.5 left-3.5 bg-slate-900/80 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1 rounded-xl">
            ${recipe.category || 'Receita'}
          </span>
        </div>
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-extrabold text-slate-800 text-base leading-snug line-clamp-1 mb-1 group-hover:text-orange-600 transition">${recipe.title}</h3>
            <p class="text-xs text-orange-600/80 font-bold mb-3">Por ${recipe.author || "Lili's Recipes"}</p>
          </div>
          <div class="flex items-center justify-between text-xs text-slate-500 font-bold pt-3 border-t border-orange-50">
            <span class="flex items-center gap-1.5"><i class="fa-regular fa-clock text-orange-500"></i> ${recipe.time}</span>
            <span class="flex items-center gap-1.5"><i class="fa-solid fa-fire text-rose-500"></i> ${recipe.difficulty}</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }
}

// FORMATAR INGREDIENTES
function formatIngredient(ingredientText, scale) {
  return ingredientText.replace(/(\d+[\.,]?\d*|\d+\/\d+)/g, (match) => {
    let value = 0;
    if (match.includes('/')) {
      const [num, den] = match.split('/');
      value = parseFloat(num) / parseFloat(den);
    } else {
      value = parseFloat(match.replace(',', '.'));
    }
    
    const scaled = value * scale;
    return Number.isInteger(scaled) ? scaled : scaled.toFixed(1).replace('.0', '');
  });
}

// TELA DE DETALHES
function openRecipeDetails(id) {
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) return;

  activeRecipeId = id;
  currentServingsScale = 1;
  const isFav = favorites.includes(recipe.id);

  const detailFavBtn = document.getElementById('detailFavBtn');
  if (detailFavBtn) {
    detailFavBtn.className = `w-11 h-11 rounded-2xl border flex items-center justify-center transition shadow-sm ${isFav ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white border-orange-100 text-slate-400'}`;
    detailFavBtn.onclick = () => toggleFavorite(recipe.id);
    detailFavBtn.innerHTML = `<i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>`;
  }

  const detailHeaderTitle = document.getElementById('detailHeaderTitle');
  if (detailHeaderTitle) detailHeaderTitle.textContent = recipe.title;

  const container = document.getElementById('recipeDetailContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Coluna Esquerda: Imagem e Cartões -->
      <div class="lg:col-span-5 space-y-4">
        <div class="relative h-72 sm:h-80 lg:h-96 w-full rounded-3xl overflow-hidden shadow-lg bg-orange-100">
          <img src="${recipe.image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80'}" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <div class="absolute bottom-6 left-6 right-6 text-white">
            <span class="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-black px-3 py-1 rounded-xl mb-2 inline-block">${recipe.category || 'Receita'}</span>
            <h1 class="text-2xl sm:text-3xl font-black leading-tight mb-1">${recipe.title}</h1>
            <p class="text-xs text-orange-200 font-medium">Receita de <strong class="text-white">${recipe.author || "Lili's Recipes"}</strong></p>
          </div>
        </div>

        <!-- Indicadores -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white border border-orange-100 p-3.5 rounded-2xl text-center shadow-sm">
            <i class="fa-regular fa-clock text-orange-500 mb-1 text-lg"></i>
            <p class="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Tempo</p>
            <p class="text-xs sm:text-sm font-extrabold text-slate-800">${recipe.time}</p>
          </div>
          <div class="bg-white border border-orange-100 p-3.5 rounded-2xl text-center shadow-sm">
            <i class="fa-solid fa-fire text-rose-500 mb-1 text-lg"></i>
            <p class="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Nível</p>
            <p class="text-xs sm:text-sm font-extrabold text-slate-800">${recipe.difficulty}</p>
          </div>
          <div class="bg-white border border-orange-100 p-3.5 rounded-2xl text-center shadow-sm">
            <i class="fa-solid fa-users text-amber-500 mb-1 text-lg"></i>
            <p class="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Rendimento</p>
            <p class="text-xs sm:text-sm font-extrabold text-slate-800" id="servingsText">${Math.round((recipe.servings || 4) * currentServingsScale)} porções</p>
          </div>
        </div>

        <!-- Botões -->
        <div class="grid grid-cols-2 gap-3 pt-1">
          <button onclick="triggerNativeFeature('Câmera')" class="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 transition shadow-sm">
            <i class="fa-solid fa-camera text-orange-400"></i>
            <span>Foto do Prato</span>
          </button>
          <button onclick="triggerNativeFeature('GPS')" class="py-3.5 px-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 active:scale-95 transition shadow-md shadow-orange-500/20">
            <i class="fa-solid fa-cart-shopping"></i>
            <span>Comprar Ingredientes</span>
          </button>
        </div>
      </div>

      <!-- Coluna Direita: Ingredientes e Modo de Preparo -->
      <div class="lg:col-span-7 space-y-6">
        
        <!-- Ingredientes -->
        <div class="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
          <div class="flex items-center justify-between mb-4 border-b border-orange-100 pb-3">
            <h3 class="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <i class="fa-solid fa-basket-shopping text-orange-500"></i> Ingredientes
            </h3>
            <div class="flex items-center gap-1 bg-orange-50 p-1 rounded-xl text-xs font-bold">
              <button onclick="adjustServings(-0.5)" class="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center text-orange-600 font-black active:scale-90">-</button>
              <span class="px-3 text-orange-800 text-xs font-extrabold" id="scaleLabel">1x</span>
              <button onclick="adjustServings(0.5)" class="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center text-orange-600 font-black active:scale-90">+</button>
            </div>
          </div>
          
          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2.5" id="ingredientsList">
            ${renderIngredientsList(recipe.ingredients || [], currentServingsScale)}
          </ul>
        </div>

        <!-- Modo de Preparo -->
        <div class="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
          <h3 class="font-extrabold text-slate-900 text-base mb-4 border-b border-orange-100 pb-3 flex items-center gap-2">
            <i class="fa-solid fa-list-check text-rose-500"></i> Modo de Preparo
          </h3>
          <ol class="space-y-3">
            ${(recipe.instructions || []).map((step, idx) => `
              <li class="flex gap-3 text-xs sm:text-sm text-slate-700 bg-orange-50/40 p-4 rounded-2xl border border-orange-100/60">
                <span class="w-7 h-7 bg-gradient-to-tr from-orange-500 to-rose-500 text-white font-extrabold rounded-xl flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                  ${idx + 1}
                </span>
                <span class="leading-relaxed pt-0.5 font-medium">${step}</span>
              </li>
            `).join('')}
          </ol>
        </div>

        <!-- Avaliações -->
        <div class="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm">
          <h3 class="font-extrabold text-slate-900 text-base mb-4 flex items-center justify-between">
            <span class="flex items-center gap-2"><i class="fa-solid fa-comments text-amber-500"></i> Opinião de quem fez</span>
            <span class="text-xs bg-orange-100 text-orange-800 font-extrabold px-3 py-1 rounded-full" id="feedbackCount">${(recipe.feedbacks ? recipe.feedbacks.length : 0)}</span>
          </h3>

          <form onsubmit="handleFeedbackSubmit(event, '${recipe.id}')" class="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 mb-4">
            <textarea id="feedbackComment" rows="2" required placeholder="Como ficou sua receita da Lili? Conta pra gente..." class="w-full p-3 bg-white border border-orange-100 rounded-xl text-xs sm:text-sm focus:border-orange-500 focus:outline-none mb-3"></textarea>
            <div class="flex items-center justify-between">
              <button type="button" onclick="triggerNativeFeature('Câmera')" class="text-xs text-slate-500 hover:text-orange-600 font-bold flex items-center gap-1.5">
                <i class="fa-solid fa-camera text-orange-500"></i> Anexar foto
              </button>
              <button type="submit" class="px-5 py-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-extrabold rounded-xl shadow-md active:scale-95 transition">
                Postar
              </button>
            </div>
          </form>

          <div class="space-y-3" id="feedbackList">
            ${renderFeedbacksList(recipe.feedbacks)}
          </div>
        </div>

      </div>

    </div>
  `;

  navigateTo('screenDetails');
}

// AUXILIARES
function renderIngredientsList(ingredients, scale) {
  if (!ingredients || ingredients.length === 0) return '';
  return ingredients.map(ing => `
    <li class="flex items-start gap-2.5 bg-orange-50/50 p-3 rounded-2xl border border-orange-100/50 text-xs sm:text-sm text-slate-700 font-medium">
      <input type="checkbox" class="mt-0.5 accent-orange-500 w-4 h-4 rounded cursor-pointer" />
      <span class="leading-relaxed">${formatIngredient(ing, scale)}</span>
    </li>
  `).join('');
}

function renderFeedbacksList(feedbacks) {
  if (!feedbacks || feedbacks.length === 0) {
    return '<p class="text-xs text-slate-400 text-center py-2">Seja o primeiro a avaliar esta receita!</p>';
  }
  return feedbacks.map(fb => `
    <div class="bg-orange-50/30 p-4 rounded-2xl border border-orange-100/60 break-words">
      <div class="flex items-center justify-between mb-1.5">
        <span class="font-extrabold text-xs sm:text-sm text-slate-800">${fb.user}</span>
        <span class="text-[10px] text-slate-400 font-bold">${fb.date}</span>
      </div>
      <p class="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">${fb.comment}</p>
      ${fb.photo ? `<img src="${fb.photo}" class="w-full h-40 object-cover rounded-2xl border border-orange-100 mt-3" />` : ''}
    </div>
  `).join('');
}

function adjustServings(delta) {
  const recipe = recipes.find(r => r.id === activeRecipeId);
  if (!recipe) return;

  if (currentServingsScale + delta < 0.5) return;
  currentServingsScale += delta;

  const scaleLabel = document.getElementById('scaleLabel');
  if (scaleLabel) scaleLabel.textContent = `${currentServingsScale}x`;

  const servingsText = document.getElementById('servingsText');
  const totalServings = Math.round((recipe.servings || 4) * currentServingsScale);
  if (servingsText) servingsText.textContent = `${totalServings} porções`;

  const ingredientsList = document.getElementById('ingredientsList');
  if (ingredientsList) ingredientsList.innerHTML = renderIngredientsList(recipe.ingredients || [], currentServingsScale);
}

// ================= SUPABASE INTEGRATION (FEEDBACK) =================
async function handleFeedbackSubmit(e, recipeId) {
  e.preventDefault();
  const commentInput = document.getElementById('feedbackComment');
  const comment = commentInput ? commentInput.value.trim() : '';

  if (!comment) return;

  const recipe = recipes.find(r => r.id === recipeId);
  if (recipe) {
    const updatedFeedbacks = recipe.feedbacks ? [...recipe.feedbacks] : [];
    updatedFeedbacks.unshift({
      user: 'Você',
      comment: comment,
      rating: 5,
      photo: null,
      date: 'Agora mesmo'
    });

    try {
      const { error } = await supabase
        .from('recipes')
        .update({ feedbacks: updatedFeedbacks })
        .eq('id', recipeId);

      if (error) throw error;

      recipe.feedbacks = updatedFeedbacks;
      document.getElementById('feedbackList').innerHTML = renderFeedbacksList(recipe.feedbacks);
      document.getElementById('feedbackCount').textContent = recipe.feedbacks.length;
      commentInput.value = '';
    } catch (error) {
      console.error('Erro ao postar comentário no Supabase:', error.message);
      alert('Erro ao enviar avaliação: ' + error.message);
    }
  }
}

// ================= SUPABASE INTEGRATION (CREATE) =================
async function handleCreateRecipe(e) {
  e.preventDefault();

  const title = document.getElementById('newTitle').value.trim();
  const time = document.getElementById('newTime').value.trim();
  const difficulty = document.getElementById('newDifficulty').value;
  const servings = parseInt(document.getElementById('newServings').value) || 4;
  const category = document.getElementById('newCategory').value;
  const image = document.getElementById('newImage').value.trim();
  
  const ingredients = document.getElementById('newIngredients').value
    .split('\n')
    .map(i => i.trim())
    .filter(i => i.length > 0);

  const instructions = document.getElementById('newInstructions').value
    .split('\n')
    .map(i => i.trim())
    .filter(i => i.length > 0);

  const newRecipe = {
    title,
    author: 'Você',
    time,
    difficulty,
    category,
    servings,
    image: image || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80',
    ingredients,
    instructions,
    feedbacks: []
  };

  try {
    const { error } = await supabase
      .from('recipes')
      .insert([newRecipe]);

    if (error) throw error;

    alert('Receita salva com sucesso na nuvem!');
    document.getElementById('createRecipeForm').reset();
    await fetchRecipes();
    setFilter('user');
  } catch (error) {
    console.error('Erro ao salvar receita no Supabase:', error.message);
    alert('Erro ao salvar receita: ' + error.message);
  }
}

function triggerNativeFeature(feature) {
  const toast = document.getElementById('nativeToast');
  const title = document.getElementById('nativeToastTitle');
  const msg = document.getElementById('nativeToastMessage');

  if (!toast || !title || !msg) return;

  if (feature === 'Câmera') {
    title.textContent = '📸 Câmera do Lili\'s Recipes';
    msg.textContent = 'Em dispositivos móveis (Capacitor/React Native), isso abriria a câmera para você fotografar seu prato.';
  } else if (feature === 'GPS') {
    title.textContent = '📍 GPS & Mercados do Lili\'s Recipes';
    msg.textContent = 'Busca automaticamente os supermercados mais próximos com os melhores preços de ingredientes.';
  }

  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 5000);
}

function closeToast() {
  const toast = document.getElementById('nativeToast');
  if (toast) toast.classList.add('hidden');
}

// Torna as funções globais para permitir chamadas via HTML (onclick/onsubmit)
window.navigateTo = navigateTo;
window.setFilter = setFilter;
window.toggleFavorite = toggleFavorite;
window.openRecipeDetails = openRecipeDetails;
window.adjustServings = adjustServings;
window.handleFeedbackSubmit = handleFeedbackSubmit;
window.handleCreateRecipe = handleCreateRecipe;
window.triggerNativeFeature = triggerNativeFeature;
window.closeToast = closeToast;
window.goToBanner = goToBanner;
window.nextBanner = nextBanner;
window.prevBanner = prevBanner;

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
  renderBanners();
  startBannerTimer();
  fetchRecipes();

  // Escuta a caixa de busca em tempo real
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', renderRecipes);
  }

  // Escuta o formulário de cadastro
  const createRecipeForm = document.getElementById('createRecipeForm');
  if (createRecipeForm) {
    createRecipeForm.addEventListener('submit', handleCreateRecipe);
  }
});