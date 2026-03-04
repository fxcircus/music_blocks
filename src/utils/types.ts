export interface Project {
  id: string;
  name: string;
  date: string;
  userId: string;
}

export interface TilesState {
  notes: string;
  rootEl: string;
  scaleEl: string;
  tonesEl: string;
  tonesArrEl: string[];
  bpmEl: string;
  soundEl: string;
  template?: string;
  progression?: number;
}

// Sample projects data for testing
export const sampleProjects: Project[] = [
  {
    "id": "ac8cf73c-d0c4-4657-b996-dd87a8acaa3f",
    "name": "The Beatles",
    "date": "Thursday, June 1, 1967",
    "userId": "1752bef8-db55-4ff2-8dea-a50486ebbb63",
  },
  {
    "id": "cc5acacc-3e45-4c02-8a31-e3897f6579b3",
    "name": "Billie Eilish",
    "date": "Friday, March 29, 2019",
    "userId": "1752bef8-db55-4ff2-8dea-a50486ebbb63",
  },
  {
    "id": "18ec402f-b5a4-4074-ae61-4405f3e779c1",
    "name": "Smashing Pumpkins",
    "date": "Friday, February 19, 1979",
    "userId": "1752bef8-db55-4ff2-8dea-a50486ebbb63",
  }
]; 