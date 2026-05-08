import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiliBauza - Admin",
  description: "Dashboard Administrativo - Mtra. Liliana Bauza",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inline script to prevent dark mode flash (FOUC)
  const themeScript = `
    (function() {
      try {
        var isDark = localStorage.getItem('zotek-dark') === 'true';
        var primary = localStorage.getItem('zotek-primary') || '#D4A5A5';
        var doc = document.documentElement;
        
        function hexToHSL(hex) {
          var r = parseInt(hex.slice(1,3),16)/255;
          var g = parseInt(hex.slice(3,5),16)/255;
          var b = parseInt(hex.slice(5,7),16)/255;
          var max = Math.max(r,g,b), min = Math.min(r,g,b);
          var h=0, s=0, l=(max+min)/2;
          if(max!==min){
            var d=max-min;
            s=l>0.5?d/(2-max-min):d/(max+min);
            switch(max){
              case r:h=((g-b)/d+(g<b?6:0))/6;break;
              case g:h=((b-r)/d+2)/6;break;
              case b:h=((r-g)/d+4)/6;break;
            }
          }
          return {h:Math.round(h*360),s:Math.round(s*100),l:Math.round(l*100)};
        }
        function hslToHex(h,s,l){
          s/=100;l/=100;
          var a=s*Math.min(l,1-l);
          var f=function(n){var k=(n+h/30)%12;var c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c).toString(16).padStart(2,'0');};
          return '#'+f(0)+f(8)+f(4);
        }
        
        var hsl = hexToHSL(primary);
        var h = hsl.h, s = hsl.s;
        
        if (isDark) {
          doc.classList.add('dark');
          doc.style.setProperty('--color-primary', primary);
          doc.style.setProperty('--color-primary-light', hslToHex(h,Math.max(s-10,10),35));
          doc.style.setProperty('--color-primary-dark', hslToHex(h,Math.max(s-5,10),55));
          doc.style.setProperty('--color-secondary', hslToHex(h,15,30));
          doc.style.setProperty('--color-background', hslToHex(h,15,10));
          doc.style.setProperty('--color-surface', hslToHex(h,12,15));
          doc.style.setProperty('--color-text', '#F1F5F9');
          doc.style.setProperty('--color-text-muted', '#94A3B8');
          doc.style.setProperty('--color-border', hslToHex(h,12,22));
          document.body.style.backgroundColor = hslToHex(h,15,10);
          document.body.style.color = '#F1F5F9';
        } else {
          doc.style.setProperty('--color-primary', primary);
          doc.style.setProperty('--color-primary-light', hslToHex(h,Math.min(s+10,100),85));
          doc.style.setProperty('--color-primary-dark', hslToHex(h,Math.max(s-10,10),45));
          doc.style.setProperty('--color-secondary', hslToHex(h,20,55));
          doc.style.setProperty('--color-background', hslToHex(h,30,97));
          doc.style.setProperty('--color-surface', '#FFFFFF');
          doc.style.setProperty('--color-text', hslToHex(h,25,18));
          doc.style.setProperty('--color-text-muted', hslToHex(h,12,45));
          doc.style.setProperty('--color-border', hslToHex(h,20,90));
          document.body.style.backgroundColor = hslToHex(h,30,97);
          document.body.style.color = hslToHex(h,25,18);
        }
      } catch(e) {}
    })();
  `;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
