import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('mc_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('mc_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('mc_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [deliveryPincode, setDeliveryPincode] = useState(() => {
    try {
      return localStorage.getItem('mc_pincode') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mc_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('mc_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error('Failed to save wishlist to localStorage', e);
    }
  }, [wishlist]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem('mc_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('mc_coupon');
      }
    } catch (e) {
      console.error('Failed to save coupon to localStorage', e);
    }
  }, [appliedCoupon]);

  const addItem = (product, quantity = 1) => {
    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.product_id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + qty
        };
        return next;
      } else {
        const primaryImg = product.primary_image?.image_url || product.image_url || product.images?.[0]?.image_url || '/chocolate-crunch-pb.jpg';
        const sPrice = parseFloat(product.selling_price) || parseFloat(product.price) || 0;
        const mrpVal = parseFloat(product.mrp) || sPrice;
        return [
          ...prev,
          {
            product_id: product.id,
            id: product.id,
            name: product.name,
            slug: product.slug,
            image_url: primaryImg,
            weight: product.weight,
            selling_unit: product.selling_unit,
            pieces_per_pack: product.pieces_per_pack,
            mrp: mrpVal,
            selling_price: sPrice,
            price: sPrice,
            discount: product.discount,
            quantity: qty
          }
        ];
      }
    });
  };

  const removeItem = (productId) => {
    setCartItems(prev => prev.filter(i => (i.product_id !== productId && i.id !== productId)));
  };

  const updateQuantity = (productId, delta) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product_id === productId || item.id === productId) {
          const newQty = (parseInt(item.quantity, 10) || 1) + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('mc_coupon');
    } catch (e) {}
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    try {
      localStorage.removeItem('mc_coupon');
    } catch (e) {}
  };

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const isWishlisted = (productId) => {
    return wishlist.some(p => p.id === productId);
  };

  const totalItems = cartItems.reduce((acc, item) => acc + (parseInt(item.quantity, 10) || 1), 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.selling_price) || parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        wishlist,
        toggleWishlist,
        isWishlisted,
        appliedCoupon,
        setAppliedCoupon,
        removeCoupon,
        deliveryPincode,
        setDeliveryPincode
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
