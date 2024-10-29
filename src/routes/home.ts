import { Router, Request, Response } from 'express';
import path from 'path';
import puppeteer from 'puppeteer';
import { fonts, primaryButtonStyles } from '../type';

const homeRouter = Router();

// Serve the HTML page
homeRouter.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Handle form submission
homeRouter.post('/submit', async (req: any, res: any) => {

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });;
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const data = await page.evaluate(() => {
      const getStyle = (el: Element | null, prop: string) => 
        el ? window.getComputedStyle(el).getPropertyValue(prop) : null;

      const fonts: Array<any> = [];
      document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        const href = link.getAttribute('href');
        if (href && href.includes('fonts.googleapis.com')) {
          const url = new URL(href);
          const family = url.searchParams.get('family') || '';
          const fontWeight = family.match(/wght@(\d+)/)?.[1] || '400';
          fonts.push({
            family: family.split(':')[0],
            variants: fontWeight,
            url: href,
          });
        }
      });

      const primaryButtonStyles: any = {};
      const button = document.querySelector('.btn, .button, .btn-primary') as HTMLElement;
      
      if (button) {
        primaryButtonStyles.fontFamily = getStyle(button, 'font-family');
        primaryButtonStyles.fontSize = getStyle(button, 'font-size');
        primaryButtonStyles.lineHeight = getStyle(button, 'line-height');
        primaryButtonStyles.letterSpacing = getStyle(button, 'letter-spacing');
        primaryButtonStyles.textTransform = getStyle(button, 'text-transform');
        primaryButtonStyles.textDecoration = getStyle(button, 'text-decoration');
        primaryButtonStyles.textAlign = getStyle(button, 'text-align');
        primaryButtonStyles.backgroundColor = getStyle(button, 'background-color');
        primaryButtonStyles.color = getStyle(button, 'color');
        primaryButtonStyles.borderColor = getStyle(button, 'border-color');
        primaryButtonStyles.borderWidth = getStyle(button, 'border-width');
        primaryButtonStyles.borderRadius = getStyle(button, 'border-radius');
      }

      return { fonts, primaryButton: primaryButtonStyles };
    });

    await browser.close();

    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to scrape the page' });
  }
});

export default homeRouter;
