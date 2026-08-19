import { ElementData, PageAnalysisData } from '../types';

export interface AIProvider {
  name: string;
  ask(userQuery: string, elementContext?: ElementData | null, pageContext?: PageAnalysisData | null): Promise<string>;
}
