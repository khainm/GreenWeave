# GreenWeave Frontend

Ứng dụng web frontend cho GreenWeave - cửa hàng thực phẩm organic.

## Tính năng

- 🏠 **Trang chủ**: Hero section với carousel, sản phẩm nổi bật
- 📱 **Responsive Design**: Tối ưu cho mobile, tablet và desktop
- 🎨 **Modern UI**: Sử dụng Tailwind CSS với thiết kế hiện đại
- 🛒 **E-commerce**: Giỏ hàng, yêu thích sản phẩm
- 🧩 **Component-based**: Kiến trúc component dễ bảo trì

## Cấu trúc dự án

```
src/
├── components/          # Các component tái sử dụng
│   ├── Header.tsx      # Header với navigation
│   ├── HeroSection.tsx # Hero section với carousel
│   ├── MobileMenu.tsx  # Menu mobile
│   └── ProductCard.tsx # Card sản phẩm
├── pages/              # Các trang
│   └── HomePage.tsx    # Trang chủ
├── assets/             # Hình ảnh, logo
├── styles/             # CSS tùy chỉnh
└── App.tsx            # Component chính
```

## Cài đặt và chạy

1. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

2. **Chạy development server:**
   ```bash
   npm run dev
   ```

3. **Build cho production:**
   ```bash
   npm run build
   ```

## Công nghệ sử dụng

- **React 19** - Framework UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Heroicons** - Icon library
- **Vite** - Build tool

## Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## Component Features

### Header
- Logo GreenWeave
- Navigation menu
- Shopping cart & user icons
- Mobile hamburger menu

### HeroSection
- Auto-playing carousel
- Navigation arrows
- Slide indicators
- Responsive images

### ProductCard
- Product image với hover effects
- Price display với discount
- Favorite button
- Add to cart functionality

### MobileMenu
- Slide-in navigation
- User authentication buttons
- Touch-friendly interface

## Customization

### Colors
- Primary: Green (#10b981)
- Secondary: Gray (#6b7280)
- Background: White (#ffffff)

### Fonts
- Primary: Inter (Google Fonts)
- Fallback: System fonts

## Performance

- Lazy loading images
- Optimized bundle size
- Smooth animations
- Fast page transitions

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Code Style
- ESLint configuration
- TypeScript strict mode
- Component-based architecture
- Responsive-first design

### Best Practices
- Semantic HTML
- Accessibility (a11y)
- SEO optimization
- Performance monitoring