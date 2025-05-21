/**
 * Callback Type Definitions
 *
 * This file contains type definitions for callbacks used throughout the application.
 * Following Next.js 15 documentation standards for type definitions.
 */

import { FormEvent, ChangeEvent, MouseEvent, KeyboardEvent } from 'react';

/**
 * Generic callback type for functions that don't return a value
 */
export type VoidCallback = () => void;

/**
 * Generic callback type with a single parameter
 */
export type Callback<T> = (param: T) => void;

/**
 * Generic callback type with a single parameter and return value
 */
export type CallbackWithReturn<T, R> = (param: T) => R;

/**
 * Generic async callback type with a single parameter
 */
export type AsyncCallback<T> = (param: T) => Promise<void>;

/**
 * Generic async callback type with a single parameter and return value
 */
export type AsyncCallbackWithReturn<T, R> = (param: T) => Promise<R>;

/**
 * Form event handler type
 */
export type FormEventHandler = (event: FormEvent<HTMLFormElement>) => void;

/**
 * Form event handler type with async support
 */
export type AsyncFormEventHandler = (event: FormEvent<HTMLFormElement>) => Promise<void>;

/**
 * Input change event handler type
 */
export type InputChangeEventHandler = (event: ChangeEvent<HTMLInputElement>) => void;

/**
 * Textarea change event handler type
 */
export type TextareaChangeEventHandler = (event: ChangeEvent<HTMLTextAreaElement>) => void;

/**
 * Select change event handler type
 */
export type SelectChangeEventHandler = (event: ChangeEvent<HTMLSelectElement>) => void;

/**
 * Generic change event handler type
 */
export type ChangeEventHandler<T = Element> = (event: ChangeEvent<T>) => void;

/**
 * Mouse event handler type
 */
export type MouseEventHandler<T = Element> = (event: MouseEvent<T>) => void;

/**
 * Keyboard event handler type
 */
export type KeyboardEventHandler<T = Element> = (event: KeyboardEvent<T>) => void;

/**
 * Date change handler type
 */
export type DateChangeHandler = (date: Date | null) => void;

/**
 * String value change handler type
 */
export type StringChangeHandler = (value: string) => void;

/**
 * Number value change handler type
 */
export type NumberChangeHandler = (value: number) => void;

/**
 * Boolean value change handler type
 */
export type BooleanChangeHandler = (value: boolean) => void;

/**
 * Generic value change handler type
 */
export type ValueChangeHandler<T> = (value: T) => void;

/**
 * ID selection handler type
 */
export type IdSelectionHandler = (id: string) => void;

/**
 * Multiple ID selection handler type
 */
export type MultiIdSelectionHandler = (ids: string[]) => void;

/**
 * Error handler type
 */
export type ErrorHandler = (error: Error | string) => void;

/**
 * Service worker message handler type
 */
export type ServiceWorkerMessageHandler = (data: any) => void;

/**
 * Window event handler type
 */
export type WindowEventHandler = (event: Event) => void;

/**
 * Window message event handler type
 */
export type WindowMessageHandler = (event: MessageEvent) => void;

/**
 * Resize observer callback type
 */
export type ResizeObserverCallback = (entries: ResizeObserverEntry[]) => void;

/**
 * Intersection observer callback type
 */
export type IntersectionObserverCallback = (entries: IntersectionObserverEntry[]) => void;

/**
 * Mutation observer callback type
 */
export type MutationObserverCallback = (mutations: MutationRecord[]) => void;
