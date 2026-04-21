// Advanced Shopping Cart with Complex State Management
class ShoppingCartApp {
  constructor() {
    this.state = {
      products: [
        {
          id: 1,
          name: "MacBook Pro 16\"",
          price: 2499,
          originalPrice: 2799,
          image: "💻",
          category: "Laptops",
          rating: 4.8,
          reviewCount: 1247,
          inStock: 15,
          description: "Powerful laptop for professionals",
          tags: ["premium", "workstation"]
        },
        {
          id: 2,
          name: "iPhone 15 Pro",
          price: 1199,
          originalPrice: 1299,
          image: "📱",
          category: "Smartphones",
          rating: 4.9,
          reviewCount: 2156,
          inStock: 8,
          description: "Latest smartphone with advanced features",
          tags: ["flagship", "camera"]
        },
        {
          id: 3,
          name: "Sony WH-1000XM5",
          price: 399,
          originalPrice: 449,
          image: "🎧",
          category: "Audio",
          rating: 4.7,
          reviewCount: 892,
          inStock: 23,
          description: "Premium noise-canceling headphones",
          tags: ["wireless", "premium"]
        },
        {
          id: 4,
          name: "Dell XPS 13",
          price: 1299,
          originalPrice: 1499,
          image: "💻",
          category: "Laptops",
          rating: 4.6,
          reviewCount: 756,
          inStock: 12,
          description: "Ultra-portable laptop",
          tags: ["ultrabook", "lightweight"]
        },
        {
          id: 5,
          name: "iPad Air",
          price: 599,
          originalPrice: 649,
          image: "📱",
          category: "Tablets",
          rating: 4.5,
          reviewCount: 634,
          inStock: 18,
          description: "Versatile tablet for work and play",
          tags: ["tablet", "creative"]
        },
        {
          id: 6,
          name: "AirPods Pro",
          price: 249,
          originalPrice: 279,
          image: "🎧",
          category: "Audio",
          rating: 4.4,
          reviewCount: 1543,
          inStock: 31,
          description: "Wireless earbuds with active noise cancellation",
          tags: ["wireless", "compact"]
        }
      ],
      cart: [],
      ui: {
        cartOpen: false,
        loading: false,
        lastAddedProduct: null
      },
      filters: {
        category: 'all',
        priceRange: [0, 3000],
        search: '',
        sortBy: 'name'
      },
      user: {
        preferences: {
          currency: 'USD',
          notifications: true
        }
      }
    };

    this.listeners = [];
    this.storageVersion = '2.0';
    this.init();
  }

  // State Management with Actions/Reducers Pattern
  dispatch(action) {
    const prevState = { ...this.state };
    this.state = this.reducer(this.state, action);
    this.notifyListeners(prevState);
    this.persistState();
    this.render();
  }

  reducer(state, action) {
    switch (action.type) {
      case 'ADD_TO_CART':
        return this.addToCartReducer(state, action.payload);

      case 'UPDATE_QUANTITY':
        return this.updateQuantityReducer(state, action.payload);

      case 'REMOVE_FROM_CART':
        return this.removeFromCartReducer(state, action.payload);

      case 'CLEAR_CART':
        return { ...state, cart: [] };

      case 'TOGGLE_CART':
        return {
          ...state,
          ui: { ...state.ui, cartOpen: !state.ui.cartOpen }
        };

      case 'SET_FILTER':
        return {
          ...state,
          filters: { ...state.filters, ...action.payload }
        };

      case 'SET_LOADING':
        return {
          ...state,
          ui: { ...state.ui, loading: action.payload }
        };

      case 'SET_LAST_ADDED':
        return {
          ...state,
          ui: { ...state.ui, lastAddedProduct: action.payload }
        };

      default:
        return state;
    }
  }

  addToCartReducer(state, { productId, quantity = 1 }) {
    const existingItem = state.cart.find(item => item.productId === productId);
    const product = state.products.find(p => p.id === productId);

    if (!product || product.inStock <= 0) {
      throw new Error('Product not available');
    }

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > product.inStock) {
        throw new Error('Not enough stock available');
      }
      return {
        ...state,
        cart: state.cart.map(item =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item
        ),
        ui: { ...state.ui, lastAddedProduct: productId }
      };
    } else {
      if (quantity > product.inStock) {
        throw new Error('Not enough stock available');
      }
      return {
        ...state,
        cart: [...state.cart, { productId, quantity, addedAt: new Date().toISOString() }],
        ui: { ...state.ui, lastAddedProduct: productId }
      };
    }
  }

  updateQuantityReducer(state, { productId, quantity }) {
    if (quantity <= 0) {
      return this.removeFromCartReducer(state, { productId });
    }

    const product = state.products.find(p => p.id === productId);
    if (!product || quantity > product.inStock) {
      throw new Error('Invalid quantity');
    }

    return {
      ...state,
      cart: state.cart.map(item =>
        item.productId === productId
          ? { ...item, quantity, updatedAt: new Date().toISOString() }
          : item
      )
    };
  }

  removeFromCartReducer(state, { productId }) {
    return {
      ...state,
      cart: state.cart.filter(item => item.productId !== productId)
    };
  }

  // Observer Pattern
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  notifyListeners(prevState) {
    this.listeners.forEach(listener => {
      try {
        listener(this.state, prevState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  // Persistence with Versioning and Migration
  persistState() {
    try {
      const dataToSave = {
        version: this.storageVersion,
        state: this.state,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('shoppingCart', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem('shoppingCart');
      if (saved) {
        const parsed = JSON.parse(saved);

        // Version migration
        if (parsed.version !== this.storageVersion) {
          parsed.state = this.migrateState(parsed.state, parsed.version);
        }

        this.state = { ...this.state, ...parsed.state };
        console.log('State loaded from localStorage');
      }
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }

  migrateState(oldState, oldVersion) {
    // Handle migrations between versions
    if (oldVersion === '1.0') {
      // Add new fields introduced in 2.0
      return {
        ...oldState,
        ui: { cartOpen: false, loading: false, lastAddedProduct: null },
        filters: {
          category: 'all',
          priceRange: [0, 3000],
          search: '',
          sortBy: 'name'
        },
        user: {
          preferences: {
            currency: 'USD',
            notifications: true
          }
        }
      };
    }
    return oldState;
  }

  // Computed Properties
  getCartTotal() {
    return this.state.cart.reduce((total, item) => {
      const product = this.state.products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  }

  getCartCount() {
    return this.state.cart.reduce((count, item) => count + item.quantity, 0);
  }

  getFilteredProducts() {
    let filtered = [...this.state.products];

    // Category filter
    if (this.state.filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === this.state.filters.category);
    }

    // Price range filter
    filtered = filtered.filter(p =>
      p.price >= this.state.filters.priceRange[0] &&
      p.price <= this.state.filters.priceRange[1]
    );

    // Search filter
    if (this.state.filters.search) {
      const searchTerm = this.state.filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (this.state.filters.sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }

  getCartItemsWithDetails() {
    return this.state.cart.map(item => {
      const product = this.state.products.find(p => p.id === item.productId);
      return {
        ...item,
        product,
        subtotal: product ? product.price * item.quantity : 0
      };
    });
  }

  // Actions
  addToCart(productId, quantity = 1) {
    try {
      this.dispatch({ type: 'ADD_TO_CART', payload: { productId, quantity } });
      this.showSuccessMessage();
    } catch (error) {
      alert(error.message);
    }
  }

  updateQuantity(productId, quantity) {
    try {
      this.dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
    } catch (error) {
      alert(error.message);
    }
  }

  removeFromCart(productId) {
    this.dispatch({ type: 'REMOVE_FROM_CART', payload: { productId } });
  }

  clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.dispatch({ type: 'CLEAR_CART' });
    }
  }

  toggleCart() {
    this.dispatch({ type: 'TOGGLE_CART' });
  }

  // UI Methods
  render() {
    this.renderProducts();
    this.renderCart();
    this.renderCartCount();
    this.updateCartVisibility();
  }

  renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    const filteredProducts = this.getFilteredProducts();

    productsGrid.innerHTML = filteredProducts.map(product => `
      <div class="product-card">
        <div class="product-image">${product.image}</div>
        <div class="product-info">
          <div class="product-category">${product.category}</div>
          <h3 class="product-name">${product.name}</h3>
          <div class="product-rating">
            <div class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</div>
            <span class="rating-count">(${product.reviewCount})</span>
          </div>
          <div class="product-price">
            $${product.price.toLocaleString()}
            ${product.originalPrice > product.price ? `<span style="text-decoration: line-through; color: #64748b; font-size: 0.9rem; margin-left: 0.5rem;">$${product.originalPrice}</span>` : ''}
          </div>
          <button
            class="add-to-cart-btn"
            onclick="app.addToCart(${product.id})"
            ${product.inStock === 0 ? 'disabled' : ''}
          >
            ${product.inStock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `).join('');
  }

  renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartFooter = document.getElementById('cartFooter');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItems || !cartFooter || !cartTotal) return;

    const items = this.getCartItemsWithDetails();

    if (items.length === 0) {
      cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
      cartFooter.style.display = 'none';
    } else {
      cartItems.innerHTML = items.map(item => `
        <div class="cart-item">
          <div class="cart-item-image">${item.product.image}</div>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.product.name}</div>
            <div class="cart-item-price">$${item.product.price} × ${item.quantity} = $${item.subtotal.toLocaleString()}</div>
            <div class="cart-item-controls">
              <button class="quantity-btn" onclick="app.updateQuantity(${item.productId}, ${item.quantity - 1})">-</button>
              <input
                type="number"
                class="quantity-input"
                value="${item.quantity}"
                min="1"
                max="${item.product.inStock}"
                onchange="app.updateQuantity(${item.productId}, parseInt(this.value))"
              >
              <button class="quantity-btn" onclick="app.updateQuantity(${item.productId}, ${item.quantity + 1})">+</button>
              <button class="remove-item" onclick="app.removeFromCart(${item.productId})" title="Remove item">×</button>
            </div>
          </div>
        </div>
      `).join('');

      cartFooter.style.display = 'block';
      cartTotal.textContent = this.getCartTotal().toLocaleString();
    }
  }

  renderCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
      const count = this.getCartCount();
      cartCount.textContent = count;
      cartCount.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  updateCartVisibility() {
    const cartSection = document.getElementById('cartSection');
    if (cartSection) {
      cartSection.classList.toggle('open', this.state.ui.cartOpen);
    }
  }

  showSuccessMessage() {
    const message = document.getElementById('successMessage');
    if (message) {
      message.style.display = 'flex';
      setTimeout(() => {
        message.style.display = 'none';
      }, 3000);
    }
  }

  // Utility Methods
  checkout() {
    const total = this.getCartTotal();
    if (total === 0) {
      alert('Your cart is empty!');
      return;
    }

    alert(`Checkout total: $${total.toLocaleString()}\n\nThis is a demo - checkout not implemented.`);
  }

  // Initialization
  init() {
    this.loadState();
    this.render();

    // Set up event listeners
    document.addEventListener('DOMContentLoaded', () => {
      this.render();
    });

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
      const cartSection = document.getElementById('cartSection');
      const cartIcon = document.querySelector('.cart-icon');

      if (this.state.ui.cartOpen &&
          cartSection &&
          !cartSection.contains(e.target) &&
          !cartIcon.contains(e.target)) {
        this.toggleCart();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.ui.cartOpen) {
        this.toggleCart();
      }
    });

    console.log('Shopping Cart App initialized');
  }
}

// Global app instance
const app = new ShoppingCartApp();

// Global functions for HTML onclick handlers
function toggleCart() {
  app.toggleCart();
}

function hideSuccessMessage() {
  const message = document.getElementById('successMessage');
  if (message) {
    message.style.display = 'none';
  }
}

function clearCart() {
  app.clearCart();
}

function checkout() {
  app.checkout();
}