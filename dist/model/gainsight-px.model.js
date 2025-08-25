"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feature = void 0;
class Feature {
    constructor(feature) {
        this.children = [];
        this.id = feature.id;
        this.name = feature.name;
        this.type = feature.type;
        this.parentFeatureId = feature.parentFeatureId;
        this.propertyKey = feature.propertyKey;
        this.status = feature.status;
        this.featureLabels = feature.featureLabels;
    }
}
exports.Feature = Feature;
//# sourceMappingURL=gainsight-px.model.js.map