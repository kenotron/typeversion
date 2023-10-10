import {Person, buildPerson} from './target';

const person = buildPerson('Alice');

function sayHello(person: Person) {
  console.log(`Hello, ${person.widenMe.length}!`);
}
