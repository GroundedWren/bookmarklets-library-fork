/*
*   dom.js: functions and constants for adding and removing DOM overlay elements
*/

import {
  createOverlay,
  addDragAndDrop
} from './overlay';

import {
  formatInfo
} from './info';

export {
  countChildrenWithTagNames,
  isDescendantOf,
  hasParentWithName,
  addNodes,
  removeNodes
};

/*
*   isVisible: Recursively check element properties from getComputedStyle
*   until document element is reached, to determine whether element or any
*   of its ancestors has properties set that affect its visibility. Called
*   by addNodes function.
*/
function isVisible (element) {

  function isVisibleRec (el) {
    if (el.nodeType === Node.DOCUMENT_NODE) return true;

    let computedStyle = window.getComputedStyle(el, null);
    let display = computedStyle.getPropertyValue('display');
    let visibility = computedStyle.getPropertyValue('visibility');
    let hidden = el.getAttribute('hidden');
    let ariaHidden = el.getAttribute('aria-hidden');

    if ((display === 'none') || (visibility === 'hidden') ||
        (hidden !== null) || (ariaHidden === 'true')) {
      return false;
    }
    return isVisibleRec(el.parentNode);
  }

  return isVisibleRec(element);
}

/*
*   countChildrenWithTagNames: For the specified DOM element, return the
*   number of its child elements with tagName equal to one of the values
*   in the tagNames array.
*/
function countChildrenWithTagNames (element, tagNames) {
  let count = 0;

  let child = element.firstElementChild;
  while (child) {
    if (tagNames.indexOf(child.tagName) > -1) count += 1;
    child = child.nextElementSibling;
  }

  return count;
}

/*
*   isDescendantOf: Determine whether element is a descendant of any
*   element in the DOM with a tagName in the list of tagNames.
*/
function isDescendantOf (element, tagNames) {
  if (typeof element.closest === 'function') {
    return tagNames.some(name => element.closest(name) !== null);
  }
  return false;
}

/*
*   hasParentWithName: Determine whether element has a parent with
*   tagName in the list of tagNames.
*/
function hasParentWithName (element, tagNames) {
  let parentTagName = element.parentElement.tagName.toLowerCase();
  if (parentTagName) {
    return tagNames.some(name => parentTagName === name);
  }
  return false;
}

/*
*   addNodes: Use targetList to generate nodeList of elements and to
*   each of these, add an overlay with a unique CSS class name.
*   Optionally, if getInfo is specified, add tooltip information;
*   if dndFlag is set, add drag-and-drop functionality.
*/
/**
 * Use select a set of elements add an overlay to each with a unique CSS class name.
 * @param {Object} params Selection options
 * @param {Array} params.targetList An array of objects describing elements to select
 * @param {string} params.cssClass Overlay css class
 * @param {function | undefined} getInfo Generates target information
 * @param {function | undefined} evalInfo Applies information to a target
 * @param {boolean | undefined} dndFlag Add drag-and-drop functionality
 * @returns The number of overlays created
 */
function addNodes (params) {
  const {targetList, cssClass, getInfo, evalInfo, dndFlag} = params;
  let counter = 0;
  getAllDocuments().forEach(doc => {
    if(!doc.querySelector(`[href="https://accessibility-bookmarklets.org/build/styles.css"]`)) {
      const link=doc.createElement('link');
      link.rel='stylesheet';
      link.type='text/css';
      link.href='https://accessibility-bookmarklets.org/build/styles.css';
      if(doc.firstElementChild) {
        doc.firstElementChild.prepend(link);
      }
    }

    targetList.forEach(function (target) {
      let elements = [...doc.querySelectorAll(target.selector)];
      elements = (typeof target.filter === 'function')
        ? elements.filter(target.filter)
        : elements;
  
      elements.forEach(element => {
        if(!isVisible(element)) { return; }
        
        const info = getInfo(element, target);
        if (evalInfo) {
          evalInfo(info, target);
        }
  
        const overlayNode = createOverlay(
          target,
          element.getBoundingClientRect(),
          cssClass,
          doc
        );
        if (dndFlag) {
          addDragAndDrop(overlayNode);
        }
        const labelNode = overlayNode.firstChild;
        labelNode.title = formatInfo(info);
        doc.body.appendChild(overlayNode);
  
        counter += 1;
      });
    });
  });

  return counter;
}

/*
*   removeNodes: Use the unique CSS class name supplied to addNodes
*   to remove all instances of the overlay nodes.
*/
/**
 * Removes dives matching a class from the document and its iframes
 * @param {string} cssClass Class of nodes to remove
 */
function removeNodes (cssClass) {
  let selector = "div." + cssClass;
  getAllDocuments().forEach(doc => {
    let elements = doc.querySelectorAll(selector);
    Array.prototype.forEach.call(elements, function (element) {
      doc.body.removeChild(element);
    });
  });
}

/**
 * Finds all documents on the page
 * @returns An array of documents
 */
function getAllDocuments() {
  return [document, ...[...document.querySelectorAll(`iframe`)].map(iframe => {
    try {
      return iframe.contentWindow.document;
    }
    catch (error) {
      return null;
    }
  }).filter(doc => !!doc)];
}
