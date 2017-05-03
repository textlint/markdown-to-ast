
//
// Copyright © 2017-present Pouya Kary <k@karyfoundation.org>
//

declare module 'markdown-to-ast' {

    //
    // ─── PARSE FUNCTION ─────────────────────────────────────────────────────────────
    //

        export function parse ( markdown: string ): IRootNode

    //
    // ─── ROOT NODE ──────────────────────────────────────────────────────────────────
    //

        export interface IRootNode {
            type: "Document"
                | "Header"
                | "Paragraph"
                | "Str"
                | "Emphasis"
                | "Strong"
                | "Code"
                | "CodeBlock"
                | "table"
                | "tableRow"
                | "tableCell"
                | "List"
                | "ListItem"
                | "Link"
                | "Image"
                | "BlockQuote"
                | "Html"

            children: IRootNode[ ]
            loc: ILoC
            raw: string
            range: number[ ]
        }

        export interface ILoC {
            start: {
                line: number,
                column: number,
            },
            end: {
                line: number,
                column: number,
            }
        }

    //
    // ─── HEADER NODE ────────────────────────────────────────────────────────────────
    //

        export interface IHeaderNode extends IRootNode {
            type: "Header"
            depth: 1 | 2 | 3 | 4 | 5 | 6
        }

    //
    // ─── PARAGRAPH NODE ─────────────────────────────────────────────────────────────
    //
        
        export interface IParagraphNode extends IRootNode {
            type: "Paragraph"
        }

    //
    // ─── STRING NODE ────────────────────────────────────────────────────────────────
    //

        export interface IStrNode extends IRootNode {
            type: "Str"
            value: string
        }

    //
    // ─── CODE BLOCK ─────────────────────────────────────────────────────────────────
    //

        export interface ICodeNode extends IRootNode {
            type: "Code",
            value: string
        }

        export interface ICodeBlockNode extends IRootNode {
            type: "CodeBlock"
            lang: string | null
            value: string
        }

    //
    // ─── LINK ───────────────────────────────────────────────────────────────────────
    //

        export interface ILinkNode extends IRootNode {
            type: "Link"
            title: string | null
            link: string
        }

    //
    // ─── IMAGE ──────────────────────────────────────────────────────────────────────
    //

        export interface IImageNode extends IRootNode {
            type: "Image"
            title: string | null
            url: string
            alt: string | null
        }

    //
    // ─── EMPHASIS NODE ──────────────────────────────────────────────────────────────
    //

        export interface IEmphasisNode extends IRootNode {
            type: "Emphasis"
        }

    //
    // ─── STRONG NODE ────────────────────────────────────────────────────────────────
    //

        export interface IStrongNode extends IRootNode {
            type: "Strong"
        }

    //
    // ─── BLOCK QUOTE NODE ───────────────────────────────────────────────────────────
    //

        export interface IBlockQuote extends IRootNode {
            type: "BlockQuote"
        }

    //
    // ─── TABLE NODE ─────────────────────────────────────────────────────────────────
    //
    
        export type TTableAlign = "left" | "center" | "right" | null

        export interface ITableNode extends IRootNode {
            table: "Table"
            align: TTableAlign[ ]
            children: ITableRowNode[ ]
        }

        export interface ITableRowNode extends IRootNode {
            type: "tableRow"
            children: ITableCellNode[ ]
        }

        export interface ITableCellNode extends IRootNode {
            type: "tableCell"
        }

    //
    // ─── LIST NODE ──────────────────────────────────────────────────────────────────
    //

        export interface IListNode extends IRootNode {
            type: "List"
            ordered: boolean
            start: number
            loose: boolean
            children: IListItemNode[ ]
        }

        export interface IListItemNode extends IRootNode {
            type: "ListItem"
            loose: boolean
            checked: null | boolean
        }

    //
    // ─── HTML NODE ──────────────────────────────────────────────────────────────────
    //

        export interface IHtmlNode extends IRootNode {
            type: "Html"
            value: string
        }

    // ────────────────────────────────────────────────────────────────────────────────

}