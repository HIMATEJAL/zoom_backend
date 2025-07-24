import { Request, Response } from 'express';
import { processNLReport } from '../services/nl-report.service';

export const handleNLReport = async (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ success: false, error: 'Query is required.' });
        }
        const result = await processNLReport(query);
        
        // Check if result contains an error
        if (result.error) {
            return res.status(400).json({ success: false, error: result.error });
        }
        
        // Return success response
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message || 'Internal server error' });
    }
}; 