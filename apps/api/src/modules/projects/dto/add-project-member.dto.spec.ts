import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AddProjectMemberDto } from './add-project-member.dto';

describe('AddProjectMemberDto', () => {
  it('accepts email invites when userId is an empty string', async () => {
    const dto = plainToInstance(AddProjectMemberDto, {
      userId: '',
      email: 'invitee@example.com',
      role: 'member',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
