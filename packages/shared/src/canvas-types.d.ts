import { CanvasElementType } from './enums';
export interface CanvasElement {
    id: string;
    type: CanvasElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    zIndex: number;
    createdBy: string;
    createdAt: string | Date;
}
export interface CanvasComment {
    id: string;
    x: number;
    y: number;
    authorId: string;
    body: string;
    resolvedAt: string | Date | null;
    createdAt: string | Date;
    replies: Array<{
        id: string;
        authorId: string;
        body: string;
        createdAt: string | Date;
    }>;
}
