import React from 'react';
import { Checkbox } from '@atlaskit/checkbox';
import { OpenQualityCheckerProject } from '../../shared/model/open-quality-checker-project';

interface ProjectSelectorProps {
  projects: OpenQualityCheckerProject[];
  selectedProjectIds: string[];
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
}

function areEqual(prevProps: ProjectSelectorProps, nextProps: ProjectSelectorProps) {
  return prevProps.selectedProjectIds.length === nextProps.selectedProjectIds.length;
}

function ProjectSelector({
  projects,
  selectedProjectIds,
  onSelect,
  onDeselect,
}: ProjectSelectorProps): JSX.Element {
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    return selectedProjectIds.includes(e.target.value)
      ? onDeselect(e.target.value)
      : onSelect(e.target.value);
  }

  return (
    <>
      {projects.map((project) => (
        <Checkbox
          key={project.id}
          isChecked={!!selectedProjectIds.find((selectedId) => selectedId === project.id)}
          onChange={onChange}
          label={project.name}
          value={project.id}
          name={`${project.name}-checkbox`}
        />
      ))}
    </>
  );
}

export default React.memo(ProjectSelector, areEqual);
